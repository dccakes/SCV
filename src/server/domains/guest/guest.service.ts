/**
 * Guest Domain - Service
 *
 * Business logic for the Guest domain.
 * Handles guest creation, updates, and retrieval.
 */

import { TRPCError } from '@trpc/server'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { GuestRepository } from '~/server/domains/guest/guest.repository'
import type { Guest, GuestWithInvitations } from '~/server/domains/guest/guest.types'

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
    ctx: AuthzContext,
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
    this.requireGuestPermission(ctx, 'create')
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
    ctx: AuthzContext,
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
    this.requireGuestPermission(ctx, 'create')
    return this.guestRepository.create({
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
    ctx: AuthzContext,
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
    this.requireGuestPermission(ctx, data.guestId ? 'update' : 'create')
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
    ctx: AuthzContext,
    weddingId: string,
    guestId: number,
    data: {
      firstName?: string
      lastName?: string
      email?: string | null
      phone?: string | null
    }
  ): Promise<Guest> {
    this.requireGuestPermission(ctx, 'update')
    await this.assertGuestInWedding(guestId, weddingId)
    return this.guestRepository.update(guestId, data)
  }

  /**
   * Delete a guest
   */
  async deleteGuest(ctx: AuthzContext, weddingId: string, guestId: number): Promise<Guest> {
    this.requireGuestPermission(ctx, 'delete')
    await this.assertGuestInWedding(guestId, weddingId)
    return this.guestRepository.delete(guestId)
  }

  /**
   * Delete multiple guests
   */
  async deleteGuests(
    ctx: AuthzContext,
    weddingId: string,
    guestIds: number[]
  ): Promise<{ count: number }> {
    this.requireGuestPermission(ctx, 'delete')
    await Promise.all(guestIds.map((guestId) => this.assertGuestInWedding(guestId, weddingId)))
    return this.guestRepository.deleteMany(guestIds)
  }

  private requireGuestPermission(
    ctx: AuthzContext,
    action: 'create' | 'update' | 'delete' | 'import'
  ): void {
    requirePermission(ctx, {
      guest: [action],
    })
  }

  private async assertGuestInWedding(guestId: number, weddingId: string): Promise<void> {
    const guest = await this.guestRepository.findById(guestId)
    if (!guest || guest.weddingId !== weddingId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to modify this guest',
      })
    }
  }
}
