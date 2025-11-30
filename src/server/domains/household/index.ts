/**
 * Household Domain - Barrel Export
 *
 * Exports all household domain components for use throughout the application.
 *
 * NOTE: HouseholdService has been removed to eliminate redundancy.
 * Use HouseholdManagementService from the application layer instead.
 */

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

// Export router
export { householdRouter } from '~/server/domains/household/household.router'
