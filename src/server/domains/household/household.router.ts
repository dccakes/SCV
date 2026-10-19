/**
 * Household Domain - Router
 *
 * tRPC router for household-related endpoints.
 * This is a thin layer that handles input validation and delegates to the application service.
 *
 * NOTE: This router now delegates to HouseholdManagementService (Application layer)
 * to eliminate redundancy between HouseholdService and HouseholdManagementService.
 */

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { householdManagementService } from '~/server/application/household-management'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import {
  bulkCreateHouseholdsSchema,
  createHouseholdSchema,
  deleteHouseholdSchema,
  publicSearchHouseholdSchema,
  searchHouseholdSchema,
  updateHouseholdSchema,
} from '~/server/domains/household/household.validator'

export const householdRouter = createTRPCRouter({
  /**
   * Create a new household with guests
   */
  create: protectedProcedure.input(createHouseholdSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return householdManagementService.createHouseholdWithGuests(ctx.authz, weddingId, input)
  }),

  /**
   * Update a household with guests
   */
  update: protectedProcedure.input(updateHouseholdSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return householdManagementService.updateHouseholdWithGuests(ctx.authz, weddingId, input)
  }),

  /**
   * Bulk create households from CSV import
   */
  bulkCreate: protectedProcedure
    .input(bulkCreateHouseholdsSchema)
    .mutation(async ({ ctx, input }) => {
      const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)

      // Event scope for the whole batch is enforced by the service.
      return householdManagementService.bulkCreateHouseholds(ctx.authz, weddingId, input.households)
    }),

  /**
   * Delete a household
   */
  delete: protectedProcedure.input(deleteHouseholdSchema).mutation(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return householdManagementService.deleteHousehold(ctx.authz, input.householdId, weddingId)
  }),

  /**
   * Search households by guest name (authenticated coordinator flow)
   */
  findBySearch: protectedProcedure.input(searchHouseholdSchema).query(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return householdManagementService.searchHouseholds(ctx.authz, weddingId, input.searchText)
  }),

  /**
   * Search households by guest name from the public guest-facing RSVP flow.
   *
   * Guests are not authenticated, so the search is scoped to the wedding that
   * owns the website subUrl instead of an active wedding session.
   */
  findBySearchPublic: publicProcedure
    .input(publicSearchHouseholdSchema)
    .query(async ({ input }) => {
      return householdManagementService.searchHouseholdsPublic(input.subUrl, input.searchText)
    }),
})
