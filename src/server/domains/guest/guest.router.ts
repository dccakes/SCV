/**
 * Guest Domain - Router
 *
 * tRPC router for guest-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'
import { guestService } from '~/server/domains/guest'
import { getByEventSchema, getByHouseholdSchema } from '~/server/domains/guest/guest.validator'
import { invitationService } from '~/server/domains/invitation'

export const guestRouter = createTRPCRouter({
  /**
   * Get all invitations by event ID
   * Note: This returns invitations, not guests - maintained for backward compatibility
   */
  getAllByEventId: publicProcedure.input(getByEventSchema).query(async ({ input }) => {
    return invitationService.getByEventId(input.eventId)
  }),

  /**
   * Get all guests by household ID
   */
  getAllByHouseholdId: publicProcedure.input(getByHouseholdSchema).query(async ({ input }) => {
    const guests = await guestService.getAllByHouseholdId(input.householdId)
    // Return in the expected format for backward compatibility
    return {
      id: input.householdId,
      guests,
    }
  }),

  /**
   * Get all guests for the current user
   */
  getAllByUserId: publicProcedure.query(async ({ ctx }) => {
    return guestService.getAllByUserId(ctx.auth.userId)
  }),
})
