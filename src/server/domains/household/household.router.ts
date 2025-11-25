/**
 * Household Domain - Router
 *
 * tRPC router for household-related endpoints.
 * This is a thin layer that handles input validation and delegates to the service.
 */

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { householdService } from '~/server/domains/household'
import {
  createHouseholdSchema,
  deleteHouseholdSchema,
  searchHouseholdSchema,
  updateHouseholdSchema,
} from '~/server/domains/household/household.validator'

export const householdRouter = createTRPCRouter({
  /**
   * Create a new household with guests
   */
  create: protectedProcedure.input(createHouseholdSchema).mutation(async ({ ctx, input }) => {
    return householdService.createHousehold(ctx.auth.userId, input)
  }),

  /**
   * Update a household with guests
   */
  update: protectedProcedure.input(updateHouseholdSchema).mutation(async ({ ctx, input }) => {
    return householdService.updateHousehold(ctx.auth.userId, input)
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
