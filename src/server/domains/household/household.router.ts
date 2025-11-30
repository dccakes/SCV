/**
 * Household Domain - Router
 *
 * tRPC router for household-related endpoints.
 * This is a thin layer that handles input validation and delegates to the application service.
 *
 * NOTE: This router now delegates to HouseholdManagementService (Application layer)
 * to eliminate redundancy between HouseholdService and HouseholdManagementService.
 */

import { TRPCError } from '@trpc/server'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { householdManagementService } from '~/server/application/household-management'
import {
  createHouseholdSchema,
  deleteHouseholdSchema,
  searchHouseholdSchema,
  updateHouseholdSchema,
} from '~/server/domains/household/household.validator'
import { db } from '~/server/infrastructure/database/client'

/**
 * Helper to get user's wedding ID
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
    return householdManagementService.createHouseholdWithGuests(weddingId, input)
  }),

  /**
   * Update a household with guests
   */
  update: protectedProcedure.input(updateHouseholdSchema).mutation(async ({ ctx, input }) => {
    const weddingId = await getUserWeddingId(ctx.auth.userId)
    return householdManagementService.updateHouseholdWithGuests(weddingId, input)
  }),

  /**
   * Delete a household
   */
  delete: protectedProcedure.input(deleteHouseholdSchema).mutation(async ({ input }) => {
    return householdManagementService.deleteHousehold(input.householdId)
  }),

  /**
   * Search households by guest name
   */
  findBySearch: publicProcedure.input(searchHouseholdSchema).query(async ({ input }) => {
    return householdManagementService.searchHouseholds(input.searchText)
  }),
})
