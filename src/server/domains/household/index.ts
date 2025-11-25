/**
 * Household Domain - Barrel Export
 *
 * Exports all household domain components for use throughout the application.
 */

import { HouseholdRepository } from '~/server/domains/household/household.repository'
import { HouseholdService } from '~/server/domains/household/household.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instances
const householdRepository = new HouseholdRepository(db)
export const householdService = new HouseholdService(householdRepository, db)

// Export types
export type {
  CreateHouseholdInput,
  DeleteHouseholdInput,
  GiftInput,
  GuestPartyInput,
  Household,
  HouseholdSearchResult,
  HouseholdWithGuests,
  HouseholdWithGuestsAndGifts,
  SearchHouseholdInput,
  UpdateHouseholdInput,
} from '~/server/domains/household/household.types'

// Export validators
export {
  createHouseholdSchema,
  type CreateHouseholdSchemaInput,
  deleteHouseholdSchema,
  type DeleteHouseholdSchemaInput,
  giftInputSchema,
  type GiftInputSchemaInput,
  guestPartyInputSchema,
  type GuestPartyInputSchemaInput,
  householdIdSchema,
  type HouseholdIdSchemaInput,
  searchHouseholdSchema,
  type SearchHouseholdSchemaInput,
  updateHouseholdSchema,
  type UpdateHouseholdSchemaInput,
} from '~/server/domains/household/household.validator'

// Export classes for testing/DI
export { HouseholdRepository } from '~/server/domains/household/household.repository'
export { HouseholdService } from '~/server/domains/household/household.service'

// Export router
export { householdRouter } from '~/server/domains/household/household.router'
