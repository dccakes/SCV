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

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { householdManagementService } from '~/server/application/household-management'
import { requireActiveWeddingId } from '~/server/authz/active-wedding'
import { eventService } from '~/server/domains/event'
import {
  bulkCreateHouseholdsSchema,
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

      // Validate that all invites event IDs belong to this wedding
      const validEvents = await eventService.getWeddingEvents(weddingId)
      const validEventIds = new Set((validEvents ?? []).map((e) => e.id))
      for (const household of input.households) {
        for (const guest of household.guestParty) {
          for (const eventId of Object.keys(guest.invites)) {
            if (!validEventIds.has(eventId)) {
              throw new TRPCError({
                code: 'FORBIDDEN',
                message: `Event ${eventId} does not belong to your wedding`,
              })
            }
          }
        }
      }

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
   * Search households by guest name
   */
  findBySearch: protectedProcedure.input(searchHouseholdSchema).query(async ({ ctx, input }) => {
    const weddingId = requireActiveWeddingId(ctx.auth.activeWeddingId)
    return householdManagementService.searchHouseholds(ctx.authz, weddingId, input.searchText)
  }),
})
