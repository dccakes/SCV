/**
 * Invitation Domain - Router
 *
 * tRPC router for invitation-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { invitationService } from '~/server/domains/invitation'
import {
  createInvitationSchema,
  updateInvitationSchema,
} from '~/server/domains/invitation/invitation.validator'
import { weddingService } from '~/server/domains/wedding'

export const invitationRouter = createTRPCRouter({
  /**
   * Create a new invitation
   */
  create: protectedProcedure.input(createInvitationSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
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
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return invitationService.getAllByWeddingId(weddingId)
  }),
})
