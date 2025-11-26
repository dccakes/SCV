/**
 * Guest Domain - Service
 *
 * Business logic for the Guest domain.
 * Handles guest creation, updates, and retrieval.
 */

import { type GuestRepository } from '~/server/domains/guest/guest.repository'
import { type Guest, type GuestWithInvitations } from '~/server/domains/guest/guest.types'

export class GuestService {
  constructor(private guestRepository: GuestRepository) {}

  /**
   * Get all guests by wedding ID
   */
  async getAllByWeddingId(weddingId: string | null): Promise<Guest[] | undefined> {
    if (!weddingId) {
      return undefined
    }
    return this.guestRepository.findByWeddingId(weddingId)
  }

  /**
   * Get all guests by household ID with invitations
   */
  async getAllByHouseholdId(householdId: string): Promise<GuestWithInvitations[]> {
    return this.guestRepository.findByHouseholdIdWithInvitations(householdId)
  }

  /**
   * Get a guest by ID
   */
  async getById(guestId: number): Promise<Guest | null> {
    return this.guestRepository.findById(guestId)
  }

  /**
   * Get a guest by ID with invitations
   */
  async getByIdWithInvitations(guestId: number): Promise<GuestWithInvitations | null> {
    return this.guestRepository.findByIdWithInvitations(guestId)
  }

  /**
   * Create a new guest
   */
  async createGuest(
    weddingId: string,
    data: {
      firstName: string
      lastName: string
      email?: string | null
      phone?: string | null
      householdId: string
      isPrimaryContact?: boolean
    }
  ): Promise<Guest> {
    return this.guestRepository.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      householdId: data.householdId,
      weddingId,
      isPrimaryContact: data.isPrimaryContact,
    })
  }

  /**
   * Create a guest with invitations
   */
  async createGuestWithInvitations(
    weddingId: string,
    data: {
      firstName: string
      lastName: string
      email?: string | null
      phone?: string | null
      householdId: string
      isPrimaryContact?: boolean
      invitations: Array<{
        eventId: string
        rsvp: string
      }>
    }
  ): Promise<Guest> {
    return this.guestRepository.createWithInvitations({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      householdId: data.householdId,
      weddingId,
      isPrimaryContact: data.isPrimaryContact,
      invitations: data.invitations.map((inv) => ({
        ...inv,
        weddingId,
      })),
    })
  }

  /**
   * Upsert a guest
   */
  async upsertGuest(
    weddingId: string,
    data: {
      guestId?: number
      firstName: string
      lastName: string
      email?: string | null
      phone?: string | null
      householdId: string
      isPrimaryContact?: boolean
    },
    invitations?: Array<{
      eventId: string
      rsvp: string
    }>
  ): Promise<Guest> {
    return this.guestRepository.upsert(
      data.guestId,
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        householdId: data.householdId,
        weddingId,
        isPrimaryContact: data.isPrimaryContact,
      },
      invitations?.map((inv) => ({
        ...inv,
        weddingId,
      }))
    )
  }

  /**
   * Update a guest
   */
  async updateGuest(
    guestId: number,
    data: {
      firstName?: string
      lastName?: string
    }
  ): Promise<Guest> {
    return this.guestRepository.update(guestId, data)
  }

  /**
   * Delete a guest
   */
  async deleteGuest(guestId: number): Promise<Guest> {
    return this.guestRepository.delete(guestId)
  }

  /**
   * Delete multiple guests
   */
  async deleteGuests(guestIds: number[]): Promise<{ count: number }> {
    return this.guestRepository.deleteMany(guestIds)
  }
}
