/**
 * Communication Log Domain - Service
 *
 * Builds a unified timeline for a household by merging:
 * 1. Manual notes from the HouseholdNote table
 * 2. Derived system events from Invitation and Gift tables
 *
 * System events are read-only aggregations - never stored redundantly.
 */

// biome-ignore lint/style/noRestrictedImports: cross-domain read-only aggregation requires direct DB access for derived timeline events
import type { PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { CommunicationLogRepository } from '~/server/domains/communication-log/communication-log.repository'
import type {
  CommunicationLogEntry,
  HouseholdNote,
} from '~/server/domains/communication-log/communication-log.types'

export class CommunicationLogService {
  constructor(
    private repository: CommunicationLogRepository,
    private db: PrismaClient
  ) {}

  /**
   * Build the unified timeline for a household.
   * Merges manual notes with derived system events, sorted newest first.
   */
  async getTimelineForHousehold(
    ctx: AuthzContext,
    weddingId: string,
    householdId: string
  ): Promise<CommunicationLogEntry[]> {
    requirePermission(ctx, { guest: ['read'] })

    // Verify household belongs to the active wedding
    const household = await this.db.household.findFirst({
      where: { id: householdId, weddingId },
      select: { id: true },
    })
    if (!household) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Household does not belong to your wedding',
      })
    }

    const [notes, invitations, gifts] = await Promise.all([
      this.repository.findByHouseholdId(householdId),
      this.getInvitationsForHousehold(householdId),
      this.getThankYouGiftsForHousehold(householdId),
    ])

    const entries: CommunicationLogEntry[] = []

    // Manual notes → NOTE entries
    for (const note of notes) {
      entries.push({
        type: 'NOTE',
        message: note.message,
        date: note.createdAt,
        id: note.id,
        actorType: note.actorType,
      })
    }

    // Invitations → INVITATION_SENT and RSVP_RECEIVED entries
    for (const inv of invitations) {
      const eventName = inv.event.name
      const guestName = `${inv.guest.firstName} ${inv.guest.lastName}`

      entries.push({
        type: 'INVITATION_SENT',
        message: `Invitation sent for ${eventName}`,
        date: inv.invitedAt,
        eventId: inv.eventId,
        eventName,
      })

      if (inv.submittedAt) {
        entries.push({
          type: 'RSVP_RECEIVED',
          message: `${guestName} RSVP'd ${inv.rsvp} for ${eventName}`,
          date: inv.submittedAt,
          eventId: inv.eventId,
          eventName,
          rsvp: inv.rsvp,
          guestName,
        })
      }
    }

    // Gifts with thank-you sent → THANK_YOU_SENT entries
    for (const gift of gifts) {
      if (gift.thankYouSentAt) {
        entries.push({
          type: 'THANK_YOU_SENT',
          message: `Thank you sent for ${gift.event.name}`,
          date: gift.thankYouSentAt,
          eventId: gift.eventId,
          eventName: gift.event.name,
        })
      }
    }

    // Sort by date descending (newest first)
    entries.sort((a, b) => b.date.getTime() - a.date.getTime())

    return entries
  }

  /**
   * Add a manual note to a household's communication log
   */
  async addNote(
    ctx: AuthzContext,
    weddingId: string,
    householdId: string,
    message: string,
    actorType: 'couple' | 'etta' = 'couple'
  ): Promise<HouseholdNote> {
    requirePermission(ctx, { guest: ['update'] })

    // weddingId is from the auth session; FK constraints on HouseholdNote ensure
    // both householdId and weddingId are valid references
    return this.repository.create({
      householdId,
      weddingId,
      message,
      actorType,
    })
  }

  /**
   * Delete a manual note from a household's communication log
   */
  async deleteNote(ctx: AuthzContext, weddingId: string, noteId: string): Promise<HouseholdNote> {
    requirePermission(ctx, { guest: ['update'] })

    const belongsToWedding = await this.repository.belongsToWedding(noteId, weddingId)
    if (!belongsToWedding) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Note does not belong to your wedding',
      })
    }

    return this.repository.delete(noteId)
  }

  /**
   * Get all invitations for guests in a household, with event and guest details
   */
  private async getInvitationsForHousehold(householdId: string) {
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
   * Get gifts with thank-you timestamps for a household
   */
  private async getThankYouGiftsForHousehold(householdId: string) {
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
