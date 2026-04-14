/**
 * Invitation Domain - Repository
 *
 * Database operations for the Invitation entity.
 * This layer handles all direct database access for invitations.
 */

import type { Prisma, PrismaClient } from '@prisma/client'

import type { Invitation } from '~/server/domains/invitation/invitation.types'

export class InvitationRepository {
  constructor(private db: PrismaClient | Prisma.TransactionClient) {}

  /**
   * Find an invitation by compound ID (guestId + eventId)
   */
  async findById(guestId: number, eventId: string): Promise<Invitation | null> {
    return this.db.invitation.findUnique({
      where: {
        guestId_eventId: {
          guestId,
          eventId,
        },
      },
    })
  }

  /**
   * Find all invitations for a wedding
   */
  async findByWeddingId(weddingId: string): Promise<Invitation[]> {
    return this.db.invitation.findMany({
      where: { weddingId },
    })
  }

  /**
   * Find all invitations for a wedding with guest tag-along status
   *
   * Used by dashboard to filter tag-along invitations from RSVP counts
   * without making additional per-event queries.
   */
  async findByWeddingIdWithGuestTagAlong(
    weddingId: string
  ): Promise<Array<Invitation & { guest: { isTagAlong: boolean } }>> {
    return this.db.invitation.findMany({
      where: { weddingId },
      include: {
        guest: { select: { isTagAlong: true } },
      },
    })
  }

  /**
   * Find all invitations for an event
   */
  async findByEventId(eventId: string): Promise<Invitation[]> {
    return this.db.invitation.findMany({
      where: { eventId },
    })
  }

  /**
   * Find all invitations for a guest
   */
  async findByGuestId(guestId: number): Promise<Invitation[]> {
    return this.db.invitation.findMany({
      where: { guestId },
    })
  }

  /**
   * Create a new invitation
   */
  async create(data: {
    guestId: number
    eventId: string
    rsvp: string
    weddingId: string
  }): Promise<Invitation> {
    return this.db.invitation.create({
      data: {
        guestId: data.guestId,
        eventId: data.eventId,
        rsvp: data.rsvp,
        weddingId: data.weddingId,
      },
    })
  }

  /**
   * Create multiple invitations at once
   */
  async createMany(
    data: Array<{
      guestId: number
      eventId: string
      rsvp: string
      weddingId: string
    }>
  ): Promise<{ count: number }> {
    return this.db.invitation.createMany({
      data: data.map((inv) => ({
        guestId: inv.guestId,
        eventId: inv.eventId,
        rsvp: inv.rsvp,
        weddingId: inv.weddingId,
      })),
    })
  }

  /**
   * Update an existing invitation
   */
  async update(
    guestId: number,
    eventId: string,
    data: {
      rsvp?: string
      submittedAt?: Date
    }
  ): Promise<Invitation> {
    return this.db.invitation.update({
      where: {
        guestId_eventId: {
          guestId,
          eventId,
        },
      },
      data: {
        rsvp: data.rsvp,
        submittedAt: data.submittedAt,
      },
    })
  }

  /**
   * Update multiple invitations at once (atomic transaction)
   */
  async updateMany(
    data: Array<{ guestId: number; eventId: string; rsvp: string }>
  ): Promise<Invitation[]> {
    return this.db.$transaction(
      data.map((inv) =>
        this.db.invitation.update({
          where: {
            guestId_eventId: {
              guestId: inv.guestId,
              eventId: inv.eventId,
            },
          },
          data: {
            rsvp: inv.rsvp,
          },
        })
      )
    )
  }

  /**
   * Check if all given invitations belong to a wedding (single query)
   */
  async allBelongToWedding(
    keys: Array<{ guestId: number; eventId: string }>,
    weddingId: string
  ): Promise<boolean> {
    const count = await this.db.invitation.count({
      where: {
        weddingId,
        OR: keys.map(({ guestId, eventId }) => ({ guestId, eventId })),
      },
    })
    return count === keys.length
  }

  /**
   * Delete an invitation
   */
  async delete(guestId: number, eventId: string): Promise<Invitation> {
    return this.db.invitation.delete({
      where: {
        guestId_eventId: {
          guestId,
          eventId,
        },
      },
    })
  }

  /**
   * Delete all invitations for a guest.
   */
  async deleteByGuest(guestId: number): Promise<{ count: number }> {
    return this.db.invitation.deleteMany({
      where: { guestId },
    })
  }

  /**
   * Delete invitations for a guest except for the allowed event IDs.
   */
  async deleteByGuestExcludingEvents(
    guestId: number,
    allowedEventIds: string[]
  ): Promise<{ count: number }> {
    return this.db.invitation.deleteMany({
      where: {
        guestId,
        eventId: { notIn: allowedEventIds },
      },
    })
  }

  /**
   * Check if an invitation exists
   */
  async exists(guestId: number, eventId: string): Promise<boolean> {
    const invitation = await this.db.invitation.findUnique({
      where: {
        guestId_eventId: {
          guestId,
          eventId,
        },
      },
      select: { guestId: true },
    })
    return invitation !== null
  }

  async findOrganizationIdByInvitationId(invitation: {
    guestId: number
    eventId: string
  }): Promise<string | null> {
    const result = await this.db.invitation.findFirst({
      where: {
        guestId: invitation.guestId,
        eventId: invitation.eventId,
      },
      select: {
        wedding: { select: { organizationId: true } },
      },
    })
    return result?.wedding?.organizationId ?? null
  }

  async belongsToWedding(guestId: number, eventId: string, weddingId: string): Promise<boolean> {
    const invitation = await this.db.invitation.findFirst({
      where: {
        guestId,
        eventId,
        weddingId,
      },
      select: { id: true },
    })

    return invitation !== null
  }

  async belongsToUser(guestId: number, eventId: string, userId: string): Promise<boolean> {
    const invitation = await this.db.invitation.findFirst({
      where: {
        guestId,
        eventId,
        wedding: {
          userWeddings: {
            some: {
              userId,
            },
          },
        },
      },
      select: { id: true },
    })

    return invitation !== null
  }

  async guestBelongsToWedding(guestId: number, weddingId: string): Promise<boolean> {
    const guest = await this.db.guest.findFirst({
      where: { id: guestId, weddingId },
      select: { id: true },
    })

    return guest !== null
  }

  async eventBelongsToWedding(eventId: string, weddingId: string): Promise<boolean> {
    const event = await this.db.event.findFirst({
      where: { id: eventId, weddingId },
      select: { id: true },
    })

    return event !== null
  }

  /**
   * Count invitations in a wedding that match specific guest-event pairs.
   */
  async countByWeddingAndGuestEventPairs(
    weddingId: string,
    pairs: Array<{ guestId: number; eventId: string }>
  ): Promise<number> {
    if (pairs.length === 0) return 0

    return this.db.invitation.count({
      where: {
        weddingId,
        OR: pairs.map((pair) => ({
          guestId: pair.guestId,
          eventId: pair.eventId,
        })),
      },
    })
  }

  /**
   * Get RSVP counts for an event
   *
   * When includeTagAlongs is false, invitations belonging to tag-along guests
   * are excluded from counts. This is the single source of truth for filtered
   * RSVP counting — callers should not replicate this logic.
   */
  async getRsvpCountsByEventId(
    eventId: string,
    options?: { includeTagAlongs?: boolean }
  ): Promise<{
    attending: number
    invited: number
    declined: number
    notInvited: number
  }> {
    const guestFilter = options?.includeTagAlongs === false ? { guest: { isTagAlong: false } } : {}

    const [attending, invited, declined, notInvited] = await Promise.all([
      this.db.invitation.count({
        where: { eventId, rsvp: 'Attending', ...guestFilter },
      }),
      this.db.invitation.count({
        where: { eventId, rsvp: 'Invited', ...guestFilter },
      }),
      this.db.invitation.count({
        where: { eventId, rsvp: 'Declined', ...guestFilter },
      }),
      this.db.invitation.count({
        where: { eventId, rsvp: 'Not Invited', ...guestFilter },
      }),
    ])

    return { attending, invited, declined, notInvited }
  }
}
