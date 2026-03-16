/**
 * Guest Domain - Router
 *
 * tRPC router for guest-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { eventService } from '~/server/domains/event'
import { guestService } from '~/server/domains/guest'
import { getByEventSchema, getByHouseholdSchema } from '~/server/domains/guest/guest.validator'
import { invitationService } from '~/server/domains/invitation'
import { weddingService } from '~/server/domains/wedding'

export const guestRouter = createTRPCRouter({
  /**
   * Get all invitations by event ID
   * Note: This returns invitations, not guests - maintained for backward compatibility
   */
  getAllByEventId: protectedProcedure.input(getByEventSchema).query(async ({ ctx, input }) => {
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    const event = await eventService.getById(input.eventId)

    if (!event || event.weddingId !== weddingId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this event invitations',
      })
    }

    return invitationService.getByEventId(input.eventId)
  }),

  /**
   * Get all guests by household ID
   */
  getAllByHouseholdId: protectedProcedure
    .input(getByHouseholdSchema)
    .query(async ({ ctx, input }) => {
      const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
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
    const weddingId = await weddingService.getWeddingIdByUserId(ctx.auth.userId)
    return guestService.getAllByWeddingId(weddingId)
  }),
})
