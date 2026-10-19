/**
 * Communication Log Domain - Repository
 *
 * Database operations for the HouseholdNote entity.
 * Only handles manual note entries - system events are derived by the service layer.
 */

import type { PrismaClient } from '@prisma/client'

import type { HouseholdNote } from '~/server/domains/communication-log/communication-log.types'

export class CommunicationLogRepository {
  constructor(private db: PrismaClient) {}

  /**
   * Find all notes for a household, newest first
   */
  async findByHouseholdId(householdId: string): Promise<HouseholdNote[]> {
    const rows = await this.db.householdNote.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
    })
    return rows as HouseholdNote[]
  }

  /**
   * Create a new note
   */
  async create(data: {
    householdId: string
    weddingId: string
    message: string
    actorType: 'couple' | 'etta'
  }): Promise<HouseholdNote> {
    const row = await this.db.householdNote.create({
      data: {
        householdId: data.householdId,
        weddingId: data.weddingId,
        message: data.message,
        actorType: data.actorType,
      },
    })
    return row as HouseholdNote
  }

  /**
   * Delete a note by ID
   */
  async delete(id: string): Promise<HouseholdNote> {
    const row = await this.db.householdNote.delete({
      where: { id },
    })
    return row as HouseholdNote
  }

  /**
   * Check if a note belongs to a wedding (for authorization)
   */
  async belongsToWedding(id: string, weddingId: string): Promise<boolean> {
    const note = await this.db.householdNote.findFirst({
      where: { id, weddingId },
      select: { id: true },
    })
    return note !== null
  }

  /**
   * Whether the household belongs to the wedding
   */
  async householdBelongsToWedding(householdId: string, weddingId: string): Promise<boolean> {
    const household = await this.db.household.findFirst({
      where: { id: householdId, weddingId },
      select: { id: true },
    })
    return household !== null
  }

  /**
   * Invitations for guests in a household, with event and guest names.
   * Read model for derived RSVP timeline entries.
   */
  async findInvitationEventsForHousehold(householdId: string) {
    return this.db.invitation.findMany({
      where: {
        guest: { householdId },
      },
      select: {
        eventId: true,
        rsvp: true,
        invitedAt: true,
        submittedAt: true,
        event: { select: { name: true } },
        guest: { select: { firstName: true, lastName: true } },
      },
    })
  }

  /**
   * Gifts with a thank-you timestamp for a household.
   * Read model for derived thank-you timeline entries.
   */
  async findThankYouGiftsForHousehold(householdId: string) {
    return this.db.gift.findMany({
      where: {
        householdId,
        thankYouSentAt: { not: null },
      },
      select: {
        eventId: true,
        thankYouSentAt: true,
        event: { select: { name: true } },
      },
    })
  }
}
