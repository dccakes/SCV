/**
 * Self-Fill Domain - Service
 *
 * Business logic for the Self-Fill guest registration feature.
 * Handles token generation, validation, and guest self-registration.
 */

import { randomBytes } from 'node:crypto'
import { TRPCError } from '@trpc/server'

import type { GuestRepository } from '~/server/domains/guest/guest.repository'
import type { HouseholdRepository } from '~/server/domains/household/household.repository'
import type { SelfFillRepository } from '~/server/domains/self-fill/self-fill.repository'
import type {
  SelfFillGuestInput,
  SelfFillRegistrationResult,
  SelfFillWeddingData,
} from '~/server/domains/self-fill/self-fill.types'

export class SelfFillService {
  constructor(
    private selfFillRepo: SelfFillRepository,
    private householdRepo: HouseholdRepository,
    private guestRepo: GuestRepository
  ) {}

  /**
   * Get wedding data by self-fill token (for public form display)
   */
  async getWeddingByToken(token: string): Promise<SelfFillWeddingData | null> {
    return this.selfFillRepo.findByToken(token)
  }

  /**
   * Generate a new self-fill token for a wedding
   */
  async generateToken(weddingId: string): Promise<string> {
    const token = randomBytes(16).toString('hex')
    await this.selfFillRepo.updateToken(weddingId, token)
    return token
  }

  /**
   * Revoke (disable) the self-fill token for a wedding
   */
  async revokeToken(weddingId: string): Promise<void> {
    await this.selfFillRepo.updateToken(weddingId, null)
  }

  /**
   * Get the current self-fill token for a wedding
   */
  async getToken(weddingId: string): Promise<string | null> {
    return this.selfFillRepo.getToken(weddingId)
  }

  /**
   * Register a guest via self-fill form
   *
   * This creates:
   * 1. A new household for the guest
   * 2. The guest as primary contact
   * 3. Invitations for all events (with 'Invited' status)
   */
  async registerGuest(
    token: string,
    data: SelfFillGuestInput
  ): Promise<SelfFillRegistrationResult> {
    // Verify token and get wedding ID
    const weddingId = await this.selfFillRepo.getWeddingIdByToken(token)
    if (!weddingId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Invalid or expired registration link',
      })
    }

    // Get wedding with events to create invitations
    const wedding = await this.selfFillRepo.findByToken(token)
    if (!wedding) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Wedding not found',
      })
    }

    const eventIds = wedding.events.map((e) => e.id)

    // Create a new household for this guest
    const household = await this.householdRepo.createWithGifts(
      {
        weddingId,
      },
      eventIds
    )

    // Create the guest with invitations for all events
    const guest = await this.guestRepo.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email ?? null,
      phone: data.phone ?? null,
      weddingId,
      householdId: household.id,
      isPrimaryContact: true,
      ageGroup: 'ADULT',
      invitations: eventIds.map((eventId) => ({
        eventId,
        rsvp: 'Invited',
        weddingId,
      })),
    })

    return {
      success: true,
      guestId: guest.id,
      householdId: household.id,
      message: `Thank you, ${data.firstName}! You have been added to the guest list.`,
    }
  }
}
