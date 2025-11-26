/**
 * Invitation Domain - Service
 *
 * Business logic for the Invitation domain.
 * Handles invitation creation, RSVP updates, and retrieval.
 */

import { type InvitationRepository } from '~/server/domains/invitation/invitation.repository'
import {
  type CreateInvitationInput,
  type Invitation,
  type RsvpStats,
  type UpdateInvitationInput,
} from '~/server/domains/invitation/invitation.types'

export class InvitationService {
  constructor(private invitationRepository: InvitationRepository) {}

  /**
   * Create a new invitation
   */
  async createInvitation(weddingId: string, data: CreateInvitationInput): Promise<Invitation> {
    return this.invitationRepository.create({
      guestId: data.guestId,
      eventId: data.eventId,
      rsvp: data.rsvp,
      weddingId,
    })
  }

  /**
   * Update an invitation RSVP
   */
  async updateInvitation(data: UpdateInvitationInput): Promise<Invitation> {
    return this.invitationRepository.update(data.guestId, data.eventId, {
      rsvp: data.rsvp,
    })
  }

  /**
   * Get all invitations for a wedding
   */
  async getAllByWeddingId(weddingId: string | null): Promise<Invitation[] | undefined> {
    if (!weddingId) {
      return undefined
    }
    return this.invitationRepository.findByWeddingId(weddingId)
  }

  /**
   * Get all invitations for an event
   */
  async getByEventId(eventId: string): Promise<Invitation[]> {
    return this.invitationRepository.findByEventId(eventId)
  }

  /**
   * Get all invitations for a guest
   */
  async getByGuestId(guestId: number): Promise<Invitation[]> {
    return this.invitationRepository.findByGuestId(guestId)
  }

  /**
   * Get RSVP statistics for an event
   */
  async getStatsForEvent(eventId: string): Promise<RsvpStats> {
    return this.invitationRepository.getRsvpCountsByEventId(eventId)
  }

  /**
   * Create invitations for a guest across multiple events
   */
  async createForGuestAndEvents(
    guestId: number,
    eventIds: string[],
    weddingId: string,
    defaultRsvp = 'Not Invited'
  ): Promise<{ count: number }> {
    return this.invitationRepository.createMany(
      eventIds.map((eventId) => ({
        guestId,
        eventId,
        rsvp: defaultRsvp,
        weddingId,
      }))
    )
  }

  /**
   * Create invitations for multiple guests across multiple events
   */
  async createForGuestsAndEvents(
    guests: Array<{ id: number }>,
    events: Array<{ id: string }>,
    weddingId: string,
    defaultRsvp = 'Not Invited'
  ): Promise<{ count: number }> {
    const invitations = guests.flatMap((guest) =>
      events.map((event) => ({
        guestId: guest.id,
        eventId: event.id,
        rsvp: defaultRsvp,
        weddingId,
      }))
    )
    return this.invitationRepository.createMany(invitations)
  }
}
