/**
 * Self-Fill Registration Application Service
 *
 * Orchestrates guest self-registration across multiple domains:
 * - Self-fill (token validation)
 * - Household (household creation)
 * - Guest (guest + invitation creation)
 *
 * All domain operations run inside a single database transaction.
 *
 * @see ARCHITECTURAL_VIOLATIONS.md — cross-domain orchestration is expected here
 */

// biome-ignore lint/style/noRestrictedImports: application service, cross-domain orchestration is expected
import type { PrismaClient } from '@prisma/client'
import { TRPCError } from '@trpc/server'

import type { GuestRepository } from '~/server/domains/guest/guest.repository'
import type { HouseholdRepository } from '~/server/domains/household/household.repository'
import type { SelfFillRepository } from '~/server/domains/self-fill/self-fill.repository'
import type {
  SelfFillGuestInput,
  SelfFillRegistrationResult,
} from '~/server/domains/self-fill/self-fill.types'

export class SelfFillRegistrationService {
  constructor(
    private db: PrismaClient,
    private selfFillRepo: SelfFillRepository,
    private householdRepo: HouseholdRepository,
    private guestRepo: GuestRepository
  ) {}

  /**
   * Register a guest via self-fill form.
   *
   * Orchestration:
   * 1. Validate token → get weddingId
   * 2. Load wedding with events
   * 3. Check for duplicate registration (by email)
   * 4. Within a transaction:
   *    a. Create household
   *    b. Create guest with invitations for all events
   * 5. Return result
   */
  async registerGuest(
    token: string,
    data: SelfFillGuestInput
  ): Promise<SelfFillRegistrationResult> {
    // 1. Validate token
    const weddingId = await this.selfFillRepo.getWeddingIdByToken(token)
    if (!weddingId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Invalid or expired registration link',
      })
    }

    // 2. Load wedding with events
    const wedding = await this.selfFillRepo.findByToken(token)
    if (!wedding) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Wedding not found',
      })
    }

    const normalizedEmail = data.email || null

    // 3. Duplicate check (only when email is provided)
    if (normalizedEmail) {
      const existing = await this.guestRepo.findByEmailAndWeddingId(normalizedEmail, weddingId)
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A guest with this email address is already registered for this wedding',
        })
      }
    }

    const eventIds = wedding.events.map((e) => e.id)

    // 4. Transactional: create household + guest + invitations
    try {
      const { householdId, guestId } = await this.db.$transaction(async () => {
        const household = await this.householdRepo.createWithGifts({ weddingId }, eventIds)

        const guest = await this.guestRepo.create({
          firstName: data.firstName,
          lastName: data.lastName,
          email: normalizedEmail,
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

        return { householdId: household.id, guestId: guest.id }
      })

      console.log(`[SelfFillRegistration] Guest registered for weddingId=${weddingId}`, {
        guestId,
        householdId,
      })

      return {
        success: true,
        guestId,
        householdId,
        message: `Thank you, ${data.firstName}! You have been added to the guest list.`,
      }
    } catch (error) {
      if (error instanceof TRPCError) throw error

      console.error(`[SelfFillRegistration] Failed to register guest for weddingId=${weddingId}`, error)

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to complete registration. Please try again.',
      })
    }
  }
}
