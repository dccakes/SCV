/**
 * Self-Fill Domain - Router
 *
 * tRPC router for self-fill guest registration endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { selfFillService } from '~/server/domains/self-fill'
import {
  generateTokenSchema,
  getByTokenSchema,
  revokeTokenSchema,
  selfFillGuestSchema,
} from '~/server/domains/self-fill/self-fill.validator'
import { weddingService } from '~/server/domains/wedding'

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
   * Creates a new household and guest with invitations
   */
  registerGuest: publicProcedure.input(selfFillGuestSchema).mutation(async ({ input }) => {
    return selfFillService.registerGuest(input.token, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email ?? null,
      phone: input.phone ?? null,
    })
  }),

  /**
   * Generate a new self-fill token (protected)
   * Only wedding owners can generate tokens
   */
  generateToken: protectedProcedure.input(generateTokenSchema).mutation(async ({ ctx }) => {
    const wedding = await weddingService.getByUserId(ctx.auth.userId)
    if (!wedding) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Wedding not found',
      })
    }

    const token = await selfFillService.generateToken(wedding.id)
    return { token }
  }),

  /**
   * Revoke the self-fill token (protected)
   * Disables the self-fill registration link
   */
  revokeToken: protectedProcedure.input(revokeTokenSchema).mutation(async ({ ctx }) => {
    const wedding = await weddingService.getByUserId(ctx.auth.userId)
    if (!wedding) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Wedding not found',
      })
    }

    await selfFillService.revokeToken(wedding.id)
    return { success: true }
  }),

  /**
   * Get the current self-fill token (protected)
   * Returns null if no token is set
   */
  getToken: protectedProcedure.query(async ({ ctx }) => {
    const wedding = await weddingService.getByUserId(ctx.auth.userId)
    if (!wedding) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Wedding not found',
      })
    }

    const token = await selfFillService.getToken(wedding.id)
    return { token }
  }),
})
