/**
 * Invitation Domain - Repository
 *
 * Database operations for the Invitation entity.
 * This layer handles all direct database access for invitations.
 */

import type { PrismaClient } from '@prisma/client'

import type { Invitation } from '~/server/domains/invitation/invitation.types'

export class InvitationRepository {
  constructor(private db: PrismaClient) {}

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
      },
    })
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
