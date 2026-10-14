import { Prisma, type PrismaClient } from '@prisma/client'

import {
  SeatAlreadyTakenError,
  SeatingTableNotFoundError,
} from '~/server/domains/seating/seating.errors'

import { NON_SEATABLE_RSVPS } from '~/server/domains/seating/seating.rules'
import type {
  CreateSeatingTableInput,
  SeatableGuestRecord,
  SeatingTable,
  SeatingTableLock,
  SeatingTableRecord,
} from '~/server/domains/seating/seating.types'

const seatableInvitation = (eventId: string) => ({
  eventId,
  rsvp: { notIn: [...NON_SEATABLE_RSVPS] },
})

// Seats whose guest has declined or lost their invitation since being seated
const staleAssignments = (eventId: string) => ({
  eventId,
  guest: { invitations: { none: seatableInvitation(eventId) } },
})

export class SeatingRepository {
  constructor(private db: PrismaClient) {}

  async eventBelongsToWedding(eventId: string, weddingId: string): Promise<boolean> {
    const event = await this.db.event.findFirst({
      where: { id: eventId, weddingId },
      select: { id: true },
    })
    return event !== null
  }

  async findTablesByEventId(eventId: string): Promise<SeatingTableRecord[]> {
    return this.db.seatingTable.findMany({
      where: { eventId },
      include: {
        seatAssignments: {
          where: { guest: { invitations: { some: seatableInvitation(eventId) } } },
          select: { guestId: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  /**
   * Invited guests for an event who have not declined, with what the seating
   * UI needs to group them by household and show their details.
   */
  async findSeatableGuests(eventId: string): Promise<SeatableGuestRecord[]> {
    return this.db.invitation.findMany({
      where: seatableInvitation(eventId),
      select: {
        rsvp: true,
        dietaryRestrictions: true,
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            ageGroup: true,
            isPrimaryContact: true,
            isTagAlong: true,
            householdId: true,
            household: {
              select: {
                id: true,
                address1: true,
                address2: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
                notes: true,
              },
            },
            guestTagAssignments: { select: { guestTag: { select: { name: true } } } },
            seatAssignments: { where: { eventId }, select: { tableId: true } },
          },
        },
      },
      orderBy: { guestId: 'asc' },
    })
  }

  async findTableById(id: string): Promise<SeatingTable | null> {
    return this.db.seatingTable.findUnique({ where: { id } })
  }

  async createTable(data: CreateSeatingTableInput & { weddingId: string }): Promise<SeatingTable> {
    return this.db.seatingTable.create({ data })
  }

  async deleteTable(id: string): Promise<SeatingTable> {
    return this.db.seatingTable.delete({ where: { id } })
  }

  /**
   * Returns the subset of guestIds that are seatable for the event.
   */
  async findSeatableGuestIds(eventId: string, guestIds: number[]): Promise<number[]> {
    const invitations = await this.db.invitation.findMany({
      where: { ...seatableInvitation(eventId), guestId: { in: guestIds } },
      select: { guestId: true },
    })
    return invitations.map((invitation) => invitation.guestId)
  }

  /**
   * Runs work in a transaction holding a row lock on the table, so capacity
   * checks and seat changes for that table are serialized. Stale seats for the
   * event are removed first so they never count toward capacity.
   */
  async withLockedTable<T>(
    table: { id: string; eventId: string },
    work: (lock: SeatingTableLock) => Promise<T>
  ): Promise<T> {
    try {
      return await this.runLocked(table, work)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new SeatAlreadyTakenError()
      }
      throw error
    }
  }

  private runLocked<T>(
    table: { id: string; eventId: string },
    work: (lock: SeatingTableLock) => Promise<T>
  ): Promise<T> {
    return this.db.$transaction(async (tx) => {
      const [locked] = await tx.$queryRaw<Array<{ name: string; capacity: number }>>`
        SELECT "name", "capacity" FROM "SeatingTable" WHERE "id" = ${table.id} FOR UPDATE`
      if (!locked) throw new SeatingTableNotFoundError()

      await tx.seatAssignment.deleteMany({ where: staleAssignments(table.eventId) })

      return work({
        table: { name: locked.name, capacity: locked.capacity },
        seatedGuestIds: async () => {
          const seats = await tx.seatAssignment.findMany({
            where: { tableId: table.id },
            select: { guestId: true },
          })
          return seats.map((seat) => seat.guestId)
        },
        // Seats guests at the table, moving them off any other table for the event
        replaceAssignments: async (guestIds) => {
          await tx.seatAssignment.deleteMany({
            where: { eventId: table.eventId, guestId: { in: guestIds } },
          })
          await tx.seatAssignment.createMany({
            data: guestIds.map((guestId) => ({
              eventId: table.eventId,
              tableId: table.id,
              guestId,
            })),
          })
        },
        updateTable: (data) => tx.seatingTable.update({ where: { id: table.id }, data }),
      })
    })
  }

  async deleteAssignments(eventId: string, guestIds: number[]): Promise<void> {
    await this.db.seatAssignment.deleteMany({ where: { eventId, guestId: { in: guestIds } } })
  }
}
