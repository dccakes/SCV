/**
 * Household Domain - Barrel Export
 *
 * Exports all household domain components for use throughout the application.
 *
 * NOTE: HouseholdService has been removed to eliminate redundancy.
 * Use HouseholdManagementService from the application layer instead.
 */

// Export classes for testing/DI
export { HouseholdRepository } from '~/server/domains/household/household.repository'
// Export router
export { householdRouter } from '~/server/domains/household/household.router'
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
  type CreateHouseholdSchemaInput,
  createHouseholdSchema,
  type DeleteHouseholdSchemaInput,
  deleteHouseholdSchema,
  type GiftInputSchemaInput,
  type GuestPartyInputSchemaInput,
  giftInputSchema,
  guestPartyInputSchema,
  type HouseholdIdSchemaInput,
  householdIdSchema,
  type SearchHouseholdSchemaInput,
  searchHouseholdSchema,
  type UpdateHouseholdSchemaInput,
  updateHouseholdSchema,
} from '~/server/domains/household/household.validator'
