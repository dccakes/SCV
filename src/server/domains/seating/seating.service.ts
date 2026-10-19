import { TRPCError } from '@trpc/server'

import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import {
  SeatAlreadyTakenError,
  SeatingTableNotFoundError,
} from '~/server/domains/seating/seating.errors'
import type { SeatingRepository } from '~/server/domains/seating/seating.repository'
import {
  getOpenSeats,
  getSeatsNeeded,
  openSeatsMessage,
  tableHasRoom,
} from '~/server/domains/seating/seating.rules'
import type {
  AssignGuestsInput,
  CreateSeatingTableInput,
  SeatableGuestRecord,
  SeatingChart,
  SeatingHousehold,
  SeatingTable,
  SeatingTableLock,
  UnassignGuestsInput,
  UpdateSeatingTableInput,
} from '~/server/domains/seating/seating.types'

const formatAddress = (household: SeatableGuestRecord['guest']['household']): string | null => {
  const cityLine = [household.city, [household.state, household.zipCode].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')
  const parts = [household.address1, household.address2, cityLine, household.country].filter(
    Boolean
  )
  return parts.length > 0 ? parts.join(', ') : null
}

const groupByHousehold = (records: SeatableGuestRecord[]): SeatingHousehold[] => {
  const households = new Map<string, SeatingHousehold>()

  for (const { rsvp, dietaryRestrictions, guest } of records) {
    let household = households.get(guest.householdId)
    if (!household) {
      household = {
        id: guest.household.id,
        address: formatAddress(guest.household),
        notes: guest.household.notes,
        guests: [],
      }
      households.set(guest.householdId, household)
    }
    household.guests.push({
      id: guest.id,
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      ageGroup: guest.ageGroup,
      isPrimaryContact: guest.isPrimaryContact,
      isTagAlong: guest.isTagAlong,
      householdId: guest.householdId,
      rsvp,
      dietaryRestrictions,
      tags: guest.guestTagAssignments.map((assignment) => assignment.guestTag.name),
      tableId: guest.seatAssignments[0]?.tableId ?? null,
    })
  }

  const sorted = [...households.values()]
  for (const household of sorted) {
    household.guests.sort(
      (a, b) => Number(b.isPrimaryContact) - Number(a.isPrimaryContact) || a.id - b.id
    )
  }
  return sorted.sort((a, b) => {
    const aName = `${a.guests[0]?.lastName ?? ''} ${a.guests[0]?.firstName ?? ''}`
    const bName = `${b.guests[0]?.lastName ?? ''} ${b.guests[0]?.firstName ?? ''}`
    return aName.localeCompare(bName)
  })
}

export class SeatingService {
  constructor(private repo: SeatingRepository) {}

  async getChart(ctx: AuthzContext, weddingId: string, eventId: string): Promise<SeatingChart> {
    requirePermission(ctx, { event: ['read'], guest: ['read'] })
    await this.assertEventInWedding(eventId, weddingId)

    const [tables, guests] = await Promise.all([
      this.repo.findTablesByEventId(eventId),
      this.repo.findSeatableGuests(eventId),
    ])

    return {
      tables: tables.map((table) => ({
        id: table.id,
        name: table.name,
        shape: table.shape,
        capacity: table.capacity,
        positionX: table.positionX,
        positionY: table.positionY,
        guestIds: table.seatAssignments.map((assignment) => assignment.guestId),
      })),
      households: groupByHousehold(guests),
    }
  }

  async createTable(
    ctx: AuthzContext,
    weddingId: string,
    input: CreateSeatingTableInput
  ): Promise<SeatingTable> {
    requirePermission(ctx, { event: ['update'] })
    await this.assertEventInWedding(input.eventId, weddingId)
    return this.repo.createTable({ ...input, weddingId })
  }

  async updateTable(
    ctx: AuthzContext,
    weddingId: string,
    id: string,
    data: UpdateSeatingTableInput
  ): Promise<SeatingTable> {
    requirePermission(ctx, { event: ['update'] })
    const table = await this.getTableInWedding(id, weddingId)

    return this.withLockedTable(table, async (lock) => {
      if (data.capacity !== undefined) {
        const seatedCount = (await lock.seatedGuestIds()).length
        if (data.capacity < seatedCount) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `${lock.table.name} has ${seatedCount} guests seated. Move guests before reducing seats.`,
          })
        }
      }
      return lock.updateTable(data)
    })
  }

  async deleteTable(ctx: AuthzContext, weddingId: string, id: string): Promise<SeatingTable> {
    requirePermission(ctx, { event: ['update'] })
    await this.getTableInWedding(id, weddingId)
    return this.repo.deleteTable(id)
  }

  async assignGuests(
    ctx: AuthzContext,
    weddingId: string,
    input: AssignGuestsInput
  ): Promise<void> {
    requirePermission(ctx, { event: ['update'] })
    const table = await this.getTableInWedding(input.tableId, weddingId)
    const guestIds = [...new Set(input.guestIds)]

    const seatableIds = new Set(await this.repo.findSeatableGuestIds(table.eventId, guestIds))
    if (guestIds.some((id) => !seatableIds.has(id))) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Only guests invited to this event who have not declined can be seated',
      })
    }

    await this.withLockedTable(table, async (lock) => {
      const { capacity, name } = lock.table
      const seatedGuestIds = await lock.seatedGuestIds()
      const seats = { capacity, guestIds: seatedGuestIds }
      if (!tableHasRoom(seats, guestIds)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: openSeatsMessage(name, getOpenSeats(seats)),
        })
      }

      if (getSeatsNeeded(seatedGuestIds, guestIds) === 0) return
      await lock.replaceAssignments(guestIds)
    })
  }

  async unassignGuests(
    ctx: AuthzContext,
    weddingId: string,
    input: UnassignGuestsInput
  ): Promise<void> {
    requirePermission(ctx, { event: ['update'] })
    await this.assertEventInWedding(input.eventId, weddingId)
    await this.repo.deleteAssignments(input.eventId, input.guestIds)
  }

  /**
   * Runs work under the table's row lock, translating concurrent-edit errors
   * from the repository into user-facing tRPC errors.
   */
  private async withLockedTable<T>(
    table: { id: string; eventId: string },
    work: (lock: SeatingTableLock) => Promise<T>
  ): Promise<T> {
    try {
      return await this.repo.withLockedTable({ id: table.id, eventId: table.eventId }, work)
    } catch (error) {
      if (error instanceof SeatAlreadyTakenError) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Someone else just moved one of these guests. Refresh and try again.',
        })
      }
      if (error instanceof SeatingTableNotFoundError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'This table was just deleted. Refresh to see the latest seating chart.',
        })
      }
      throw error
    }
  }

  private async assertEventInWedding(eventId: string, weddingId: string): Promise<void> {
    const inScope = await this.repo.eventBelongsToWedding(eventId, weddingId)
    if (!inScope) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this event',
      })
    }
  }

  private async getTableInWedding(id: string, weddingId: string): Promise<SeatingTable> {
    const table = await this.repo.findTableById(id)
    if (!table || table.weddingId !== weddingId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this table',
      })
    }
    return table
  }
}
