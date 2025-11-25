/**
 * Household Management Application Service - Barrel Export
 *
 * Exports all household management application service components.
 */

import { HouseholdManagementService } from '~/server/application/household-management/household-management.service'
import { eventService } from '~/server/domains/event'
import { giftService } from '~/server/domains/gift'
import { guestService } from '~/server/domains/guest'
import { householdService } from '~/server/domains/household'
import { invitationService } from '~/server/domains/invitation'
import { db } from '~/server/infrastructure/database'

// Create singleton instance with injected domain services
export const householdManagementService = new HouseholdManagementService(
  householdService,
  guestService,
  invitationService,
  eventService,
  giftService,
  db
)

// Export types
export type {
  CreateHouseholdResult,
  CreateHouseholdWithGuestsInput,
  UpdateHouseholdResult,
  UpdateHouseholdWithGuestsInput,
} from '~/server/application/household-management/household-management.types'

// Export validators
export {
  createHouseholdWithGuestsSchema,
  type CreateHouseholdWithGuestsSchemaInput,
  deleteHouseholdSchema,
  type DeleteHouseholdSchemaInput,
  giftInputSchema,
  type GiftInputSchemaInput,
  guestPartyInputSchema,
  type GuestPartyInputSchemaInput,
  updateHouseholdWithGuestsSchema,
  type UpdateHouseholdWithGuestsSchemaInput,
} from '~/server/application/household-management/household-management.validator'

// Export classes for testing/DI
export { HouseholdManagementService } from '~/server/application/household-management/household-management.service'

// Export router
export { householdManagementRouter } from '~/server/application/household-management/household-management.router'
