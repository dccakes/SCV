/**
 * Guest Domain - Router
 *
 * tRPC router for guest-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { requirePermission } from '~/server/authz/permission-checker'
import { guestService } from '~/server/domains/guest'
import { getByEventSchema, getByHouseholdSchema } from '~/server/domains/guest/guest.validator'
import { invitationService } from '~/server/domains/invitation'

export const guestRouter = createTRPCRouter({
  /**
   * Get all invitations by event ID
   * Note: This returns invitations, not guests - maintained for backward compatibility
   */
  getAllByEventId: protectedProcedure.input(getByEventSchema).query(async ({ ctx, input }) => {
    requirePermission(ctx.authz, { guest_invitation: ['read'] })
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return invitationService.getByEventIdInWedding(input.eventId, weddingId)
  }),

  /**
   * Get all guests by household ID
   */
  getAllByHouseholdId: protectedProcedure
    .input(getByHouseholdSchema)
    .query(async ({ ctx, input }) => {
      requirePermission(ctx.authz, { guest: ['read'] })
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
      const guests = await guestService.getAllByHouseholdId(input.householdId)

      const inScope = guests.every((guest) => guest.weddingId === weddingId)
      if (!inScope) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this household',
        })
      }

      // Return in the expected format for backward compatibility
      return {
        id: input.householdId,
        guests,
      }
    }),

  /**
   * Get all guests for the current user's wedding
   */
  getAllByUserId: protectedProcedure.query(async ({ ctx }) => {
    requirePermission(ctx.authz, { guest: ['read'] })
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return guestService.getAllByWeddingId(weddingId)
  }),
})
