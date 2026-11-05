/**
 * Guest Domain - Router
 *
 * tRPC router for guest-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { guestExportService } from '~/server/application/guest-export'
import { guestInsightsService } from '~/server/application/guest-insights'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { getByEventSchema, getByHouseholdSchema } from '~/server/domains/guest/guest.validator'

export const guestRouter = createTRPCRouter({
  /**
   * Get all invitations by event ID
   * Note: This returns invitations, not guests - maintained for backward compatibility
   */
  getAllByEventId: protectedProcedure.input(getByEventSchema).query(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return guestInsightsService.listEventInvitations(ctx.authz, weddingId, input.eventId)
  }),

  /**
   * Get all guests by household ID
   */
  getAllByHouseholdId: protectedProcedure
    .input(getByHouseholdSchema)
    .query(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      return guestInsightsService.listHouseholdGuests(ctx.authz, weddingId, input.householdId)
    }),

  /**
   * Get all guests for the current user's wedding
   */
  getAllByUserId: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return guestInsightsService.listGuests(ctx.authz, weddingId)
  }),

  /**
   * Everything needed to build the guest list CSV exports (whole wedding or
   * one event): guests, households, RSVPs and RSVP question answers
   */
  getExportData: protectedProcedure.query(async ({ ctx }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return guestExportService.getExportData(ctx.authz, weddingId)
  }),
})
