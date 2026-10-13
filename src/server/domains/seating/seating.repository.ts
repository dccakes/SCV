import type { PrismaClient } from '@prisma/client'

import { NON_SEATABLE_RSVPS } from '~/server/domains/seating/seating.rules'
import type {
  CreateSeatingTableInput,
  SeatableGuestRecord,
  SeatingTable,
  SeatingTableRecord,
  UpdateSeatingTableInput,
} from '~/server/domains/seating/seating.types'

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
        seatAssignments: { select: { guestId: true }, orderBy: { createdAt: 'asc' } },
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
      where: { eventId, rsvp: { notIn: [...NON_SEATABLE_RSVPS] } },
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

  async findTableById(id: string): Promise<SeatingTableRecord | null> {
    return this.db.seatingTable.findUnique({
      where: { id },
      include: { seatAssignments: { select: { guestId: true } } },
    })
  }

  async createTable(data: CreateSeatingTableInput & { weddingId: string }): Promise<SeatingTable> {
    return this.db.seatingTable.create({ data })
  }

  async updateTable(id: string, data: UpdateSeatingTableInput): Promise<SeatingTable> {
    return this.db.seatingTable.update({ where: { id }, data })
  }

  async deleteTable(id: string): Promise<SeatingTable> {
    return this.db.seatingTable.delete({ where: { id } })
  }

  /**
   * Returns the subset of guestIds that are seatable for the event.
   */
  async findSeatableGuestIds(eventId: string, guestIds: number[]): Promise<number[]> {
    const invitations = await this.db.invitation.findMany({
      where: { eventId, guestId: { in: guestIds }, rsvp: { notIn: [...NON_SEATABLE_RSVPS] } },
      select: { guestId: true },
    })
    return invitations.map((invitation) => invitation.guestId)
  }

  /**
   * Seats guests at a table, moving them off any other table for the event.
   */
  async replaceAssignments(eventId: string, tableId: string, guestIds: number[]): Promise<void> {
    await this.db.$transaction([
      this.db.seatAssignment.deleteMany({ where: { eventId, guestId: { in: guestIds } } }),
      this.db.seatAssignment.createMany({
        data: guestIds.map((guestId) => ({ eventId, tableId, guestId })),
      }),
    ])
  }

  async deleteAssignments(eventId: string, guestIds: number[]): Promise<void> {
    await this.db.seatAssignment.deleteMany({ where: { eventId, guestId: { in: guestIds } } })
  }
}
