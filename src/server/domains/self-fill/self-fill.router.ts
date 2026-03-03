/**
 * Self-Fill Domain - Router
 *
 * tRPC router for self-fill guest registration endpoints.
 * Token management delegates to SelfFillService (domain).
 * Guest registration delegates to SelfFillRegistrationService (application layer).
 */

import { TRPCError } from '@trpc/server'

import { selfFillRegistrationService } from '~/server/application/self-fill-registration'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { selfFillService } from '~/server/domains/self-fill'
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

export const selfFillRouter = createTRPCRouter({
  /**
   * Get wedding data by self-fill token (public)
   * Used by the self-fill registration form
   */
  getByToken: publicProcedure.input(getByTokenSchema).query(async ({ input }) => {
    return selfFillService.getWeddingByToken(input.token)
  }),

  /**
   * Register a guest via self-fill form (public)
   * Delegates to SelfFillRegistrationService (application layer) for
   * cross-domain orchestration: household + guest + invitations.
   */
  registerGuest: publicProcedure.input(selfFillGuestSchema).mutation(async ({ input }) => {
    return selfFillRegistrationService.registerGuest(input.token, {
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
   * Returns null if no token is set.
   */
  getToken: protectedProcedure.query(async ({ ctx }) => {
    const wedding = await getOwnedWedding(ctx.auth.userId)
    const token = await selfFillService.getToken(wedding.id)
    return { token }
  }),
})
