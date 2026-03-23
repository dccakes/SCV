/**
 * Wedding Domain - Router
 *
 * tRPC router for wedding-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { toAuthzContext } from '~/server/authz/authorization.types'
import { weddingService } from '~/server/domains/wedding'
import {
  createWeddingSchema,
  updateWeddingSchema,
} from '~/server/domains/wedding/wedding.validator'

export const weddingRouter = createTRPCRouter({
  /**
   * Create a new wedding (onboarding)
   * Creates wedding, UserWedding join entry, optional event, and updates user profile
   */
  create: protectedProcedure.input(createWeddingSchema).mutation(async ({ ctx, input }) => {
    return weddingService.createWedding(ctx.auth.userId, {
      userId: ctx.auth.userId,
      ...input,
    })
  }),

  /**
   * Update wedding settings
   */
  update: protectedProcedure.input(updateWeddingSchema).mutation(async ({ ctx, input }) => {
    const wedding = await weddingService.getScopedWeddingByUserId(
      ctx.auth.userId,
      ctx.auth.sessionActiveOrganizationId
    )

    return weddingService.updateWedding({
      ctx: toAuthzContext(ctx),
      weddingId: wedding.id,
      organizationId: wedding.organizationId,
      data: input,
    })
  }),

  /**
   * Get wedding for current user
   */
  getByUserId: protectedProcedure.query(async ({ ctx }) => {
    return weddingService.getByUserId(ctx.auth.userId)
  }),

  /**
   * Check if current user has a wedding
   */
  hasWedding: protectedProcedure.query(async ({ ctx }) => {
    return weddingService.hasWedding(ctx.auth.userId)
  }),
})
