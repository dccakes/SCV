/**
 * Self-Fill Registration Application Service
 *
 * Orchestrates guest self-registration across multiple domains:
 * - Self-fill (token validation + expiry)
 * - Household (household creation)
 * - Guest (guest + invitation creation)
 *
 * All domain operations run inside a single database transaction.
 * Duplicate check is inside the transaction to reduce the TOCTOU window
 * (a DB-level @@unique([weddingId, email]) constraint is the final guard).
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
  ISelfFillRegistration,
  SelfFillGuestInput,
  SelfFillRegistrationResult,
} from '~/server/domains/self-fill/self-fill.types'

// ─── Registration defaults ──────────────────────────────────────────────────
const DEFAULT_AGE_GROUP = 'ADULT' as const
const DEFAULT_RSVP_STATUS = 'Invited' as const
const DEFAULT_IS_PRIMARY_CONTACT = true

export class SelfFillRegistrationService implements ISelfFillRegistration {
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
   * 1. Validate token → load wedding with events (single query, includes expiry check)
   * 2. Guard: wedding must have at least one event
   * 3. Within a transaction:
   *    a. Duplicate check (by normalised email + weddingId)
   *    b. Create household
   *    c. Create guest with invitations for all events
   * 4. Return result
   */
  async registerGuest(
    token: string,
    data: SelfFillGuestInput
  ): Promise<SelfFillRegistrationResult> {
    // 1. Validate token + load wedding in one query (P11)
    const wedding = await this.selfFillRepo.findByToken(token)
    if (!wedding) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Invalid or expired registration link',
      })
    }

    const weddingId = wedding.id
    const eventIds = wedding.events.map((e) => e.id)

    // 2. Guard: wedding must have events to create invitations (P10)
    if (eventIds.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Invalid or expired registration link',
      })
    }

    // Normalise email: empty string → null, lowercase + trim (P6)
    const normalizedEmail = data.email ? data.email.toLowerCase().trim() : null

    // 3. Transactional: duplicate check + create household + guest + invitations (P2)
    try {
      const { householdId, guestId } = await this.db.$transaction(async () => {
        // Duplicate check inside transaction to reduce TOCTOU window (P2)
        if (normalizedEmail) {
          const existing = await this.guestRepo.findByEmailAndWeddingId(normalizedEmail, weddingId)
          if (existing) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'You are already registered for this wedding.',
            })
          }
        }

        const household = await this.householdRepo.createWithGifts({ weddingId }, eventIds)

        const guest = await this.guestRepo.create({
          firstName: data.firstName,
          lastName: data.lastName,
          email: normalizedEmail,
          phone: data.phone ?? null,
          weddingId,
          householdId: household.id,
          isPrimaryContact: DEFAULT_IS_PRIMARY_CONTACT,
          ageGroup: DEFAULT_AGE_GROUP,
          invitations: eventIds.map((eventId) => ({
            eventId,
            rsvp: DEFAULT_RSVP_STATUS,
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

      // DB unique constraint violation — treat as duplicate (P2)
      // Duck-typed check avoids importing Prisma namespace (generated client not available in tests)
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You are already registered for this wedding.',
        })
      }

      console.error(`[SelfFillRegistration] Failed to register guest for weddingId=${weddingId}`, error)

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to complete registration. Please try again.',
      })
    }
  }
}
