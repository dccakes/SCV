/**
 * Household Management Application Service - Barrel Export
 *
 * Exports all household management application service components.
 */

import { HouseholdManagementService } from '~/server/application/household-management/household-management.service'
import { GiftRepository } from '~/server/domains/gift/gift.repository'
import { GuestRepository } from '~/server/domains/guest/guest.repository'
import { HouseholdRepository } from '~/server/domains/household/household.repository'
import { InvitationRepository } from '~/server/domains/invitation/invitation.repository'
import { db } from '~/server/infrastructure/database'

// Create repository instances
const householdRepo = new HouseholdRepository(db)
const guestRepo = new GuestRepository(db)
const invitationRepo = new InvitationRepository(db)
const giftRepo = new GiftRepository(db)

// Create singleton instance with injected repositories
export const householdManagementService = new HouseholdManagementService(
  householdRepo,
  guestRepo,
  invitationRepo,
  giftRepo,
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
