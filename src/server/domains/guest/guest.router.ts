/**
 * Guest Domain - Router
 *
 * tRPC router for guest-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { TRPCError } from '@trpc/server'

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'
import { guestService } from '~/server/domains/guest'
import { getByEventSchema, getByHouseholdSchema } from '~/server/domains/guest/guest.validator'
import { invitationService } from '~/server/domains/invitation'
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
   * Get all guests for the current user's wedding
   */
  getAllByUserId: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.userId) return undefined
    const weddingId = await getUserWeddingId(ctx.auth.userId)
    return guestService.getAllByWeddingId(weddingId)
  }),
})
