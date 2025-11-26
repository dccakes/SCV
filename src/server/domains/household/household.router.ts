/**
 * Household Domain - Router
 *
 * tRPC router for household-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { householdService } from '~/server/domains/household'
import {
  createHouseholdSchema,
  deleteHouseholdSchema,
  searchHouseholdSchema,
  updateHouseholdSchema,
} from '~/server/domains/household/household.validator'
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

export const householdRouter = createTRPCRouter({
  /**
   * Create a new household with guests
   */
  create: protectedProcedure.input(createHouseholdSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await getUserWeddingId(ctx.auth.userId)
    return householdService.createHousehold(weddingId, input)
  }),

  /**
   * Update a household with guests
   */
  update: protectedProcedure.input(updateHouseholdSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await getUserWeddingId(ctx.auth.userId)
    return householdService.updateHousehold(weddingId, input)
  }),

  /**
   * Delete a household
   */
  delete: protectedProcedure.input(deleteHouseholdSchema).mutation(async ({ input }) => {
    return householdService.deleteHousehold(input)
  }),

  /**
   * Search households by guest name
   */
  findBySearch: publicProcedure.input(searchHouseholdSchema).query(async ({ input }) => {
    return householdService.searchHouseholds(input)
  }),
})
