/**
 * Invitation Domain - Router
 *
 * tRPC router for invitation-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { invitationService } from '~/server/domains/invitation'
import {
  createInvitationSchema,
  updateInvitationSchema,
} from '~/server/domains/invitation/invitation.validator'
import { db } from '~/server/infrastructure/database/client'

/**
 * Helper to get user's wedding ID
 * TODO: Move to Wedding service or Application layer when refactoring cross-domain logic
 */
async function getUserWeddingId(userId: string): Promise<string> {
  const userWedding = await db.userWedding.findFirst({
    where: { userId },
    orderBy: { isPrimary: 'desc' },
  })

  if (!userWedding) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'No wedding found for user. Please complete onboarding first.',
    })
  }

  return userWedding.weddingId
}

export const invitationRouter = createTRPCRouter({
  /**
   * Create a new invitation
   */
  create: protectedProcedure.input(createInvitationSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await getUserWeddingId(ctx.auth.userId)
    return invitationService.createInvitation(weddingId, input)
  }),

  /**
   * Update an invitation RSVP
   */
  update: protectedProcedure.input(updateInvitationSchema).mutation(async ({ input }) => {
    return invitationService.updateInvitation(input)
  }),

  /**
   * Get all invitations for the current user's wedding
   */
  getAllByUserId: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.userId) return undefined
    const weddingId = await getUserWeddingId(ctx.auth.userId)
    return invitationService.getAllByWeddingId(weddingId)
  }),
})
