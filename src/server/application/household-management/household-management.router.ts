/**
 * Household Management Application Service - Router
 *
 * tRPC router for complex household management operations.
 * This is a thin layer that validates input and calls the service.
 */

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { HouseholdManagementService } from '~/server/application/household-management/household-management.service'
import {
  createHouseholdWithGuestsSchema,
  deleteHouseholdSchema,
  updateHouseholdWithGuestsSchema,
} from '~/server/application/household-management/household-management.validator'
import { eventService } from '~/server/domains/event'
import { giftService } from '~/server/domains/gift'
import { guestService } from '~/server/domains/guest'
import { householdService } from '~/server/domains/household'
import { invitationService } from '~/server/domains/invitation'
import { db } from '~/server/infrastructure/database'

const householdManagementService = new HouseholdManagementService(
  householdService,
  guestService,
  invitationService,
  eventService,
  giftService,
  db
)

export const householdManagementRouter = createTRPCRouter({
  /**
   * Create a new household with guests and auto-create invitations
   */
  createWithGuests: protectedProcedure
    .input(createHouseholdWithGuestsSchema)
    .mutation(async ({ ctx, input }) => {
      return householdManagementService.createHouseholdWithGuests(ctx.auth.userId, input)
    }),

  /**
   * Update a household with guests, invitations, and gifts
   */
  updateWithGuests: protectedProcedure
    .input(updateHouseholdWithGuestsSchema)
    .mutation(async ({ ctx, input }) => {
      return householdManagementService.updateHouseholdWithGuests(ctx.auth.userId, input)
    }),

  /**
   * Delete a household and all associated data
   */
  delete: protectedProcedure.input(deleteHouseholdSchema).mutation(async ({ input }) => {
    return householdManagementService.deleteHousehold(input.householdId)
  }),
})
