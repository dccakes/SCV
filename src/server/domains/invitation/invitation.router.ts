/**
 * Invitation Domain - Router
 *
 * tRPC router for invitation-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { eventInsightsService } from '~/server/application/event-insights'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { invitationService } from '~/server/domains/invitation'
import {
  bulkUpdateInvitationsSchema,
  createInvitationSchema,
  updateInvitationSchema,
} from '~/server/domains/invitation/invitation.validator'

export const invitationRouter = createTRPCRouter({
  /**
   * Create a new invitation
   */
  create: protectedProcedure.input(createInvitationSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return invitationService.createInvitation(ctx.authz, weddingId, input)
  }),

  /**
   * Update an invitation RSVP
   */
  update: protectedProcedure.input(updateInvitationSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return invitationService.updateInvitation(ctx.authz, weddingId, input)
  }),

  /**
   * Bulk update invitations (e.g., mark multiple guests as "Invited" for an event)
   */
  bulkUpdate: protectedProcedure
    .input(bulkUpdateInvitationsSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return invitationService.bulkUpdateInvitations(ctx.authz, weddingId, input)
    }),

  /**
   * Get all invitations for the current user's wedding
   */
  getAllByUserId: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return eventInsightsService.listInvitations(ctx.authz, weddingId)
  }),
})
