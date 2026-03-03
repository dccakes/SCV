/**
 * Self-Fill Domain - Router Factory
 *
 * tRPC router for self-fill guest registration endpoints.
 * Token management delegates to SelfFillService (domain).
 * Guest registration delegates to ISelfFillRegistration (injected — implemented by application layer).
 *
 * The router is a factory to avoid importing application services from the domain layer.
 * Usage:  createSelfFillRouter(selfFillRegistrationService)
 */

import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { selfFillService } from '~/server/domains/self-fill'
import type { ISelfFillRegistration } from '~/server/domains/self-fill/self-fill.types'
import {
  generateTokenSchema,
  getByTokenSchema,
  revokeTokenSchema,
  selfFillGuestSchema,
} from '~/server/domains/self-fill/self-fill.validator'
import { weddingService } from '~/server/domains/wedding'

/**
 * Fetch the authenticated user's wedding and assert ownership.
 * Throws NOT_FOUND if the user has no associated wedding.
 */
async function getOwnedWedding(userId: string) {
  const wedding = await weddingService.getByUserId(userId)
  if (!wedding) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Wedding not found',
    })
  }
  return wedding
}

/**
 * Create the self-fill tRPC router.
 * @param registrationService - Application service implementing ISelfFillRegistration.
 *   Injected at root.ts to keep the domain free of application-layer imports.
 */
export function createSelfFillRouter(registrationService: ISelfFillRegistration) {
  return createTRPCRouter({
    /**
     * Get wedding data by self-fill token (public)
     * Used by the self-fill registration form
     */
    getByToken: publicProcedure.input(getByTokenSchema).query(async ({ input }) => {
      return selfFillService.getWeddingByToken(input.token)
    }),

    /**
     * Register a guest via self-fill form (public)
     * Delegates to ISelfFillRegistration for cross-domain orchestration.
     */
    registerGuest: publicProcedure.input(selfFillGuestSchema).mutation(async ({ input }) => {
      return registrationService.registerGuest(input.token, {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email ?? null,
        phone: input.phone ?? null,
      })
    }),

    /**
     * Generate a new self-fill token (protected)
     * Only the wedding owner can generate tokens.
     */
    generateToken: protectedProcedure.input(generateTokenSchema).mutation(async ({ ctx }) => {
      const wedding = await getOwnedWedding(ctx.auth.userId)
      const token = await selfFillService.generateToken(wedding.id)
      return { token }
    }),

    /**
     * Revoke the self-fill token (protected)
     * Disables the self-fill registration link.
     */
    revokeToken: protectedProcedure.input(revokeTokenSchema).mutation(async ({ ctx }) => {
      const wedding = await getOwnedWedding(ctx.auth.userId)
      await selfFillService.revokeToken(wedding.id)
      return { success: true }
    }),

    /**
     * Get the current self-fill token (protected)
     * Returns null token if no token is set.
     * Also returns expiresAt (null for legacy tokens with no timestamp) and
     * earliestEventDate so the UI can warn if the link expires before the wedding.
     */
    getToken: protectedProcedure.query(async ({ ctx }) => {
      const wedding = await getOwnedWedding(ctx.auth.userId)
      const tokenData = await selfFillService.getToken(wedding.id)

      const earliestEvent = await ctx.db.event.findFirst({
        where: { weddingId: wedding.id, date: { not: null } },
        orderBy: { date: 'asc' },
        select: { date: true },
      })

      return {
        token: tokenData?.token ?? null,
        expiresAt: tokenData?.expiresAt ?? null,
        earliestEventDate: earliestEvent?.date ?? null,
      }
    }),
  })
}
