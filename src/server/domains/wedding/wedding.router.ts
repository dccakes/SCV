/**
 * Wedding Domain - Router
 *
 * tRPC router for wedding-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import type { AuthzContext } from '~/server/authz/authorization.types'
import { weddingService } from '~/server/domains/wedding'
import {
  createWeddingSchema,
  getByUserIdSchema,
  updateWeddingSchema,
} from '~/server/domains/wedding/wedding.validator'

const toAuthzContext = (ctx: {
  auth: {
    userId: string
    sessionActiveOrganizationId: string | null
  }
  headers: Headers
}): AuthzContext => ({
  userId: ctx.auth.userId,
  headers: ctx.headers,
  sessionActiveOrganizationId: ctx.auth.sessionActiveOrganizationId,
})

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
    const wedding = await weddingService.getByUserId(ctx.auth.userId)
    if (!wedding) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Wedding not found' })
    }

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
  getByUserId: protectedProcedure.input(getByUserIdSchema).query(async ({ ctx, input }) => {
    return weddingService.getByUserId(input?.userId ?? ctx.auth.userId)
  }),

  /**
   * Check if current user has a wedding
   */
  hasWedding: protectedProcedure.query(async ({ ctx }) => {
    return weddingService.hasWedding(ctx.auth.userId)
  }),
})
