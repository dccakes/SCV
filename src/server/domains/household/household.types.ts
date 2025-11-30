/**
 * Household Domain - Types
 *
 * Type definitions for the Household domain entity.
 * Households represent guest groups/families sharing an address.
 *
 * Note: Input types are derived from Zod schemas (single source of truth).
 * Only entity types representing database models are manually defined.
 */

import { type Gift } from '~/server/domains/gift/gift.types'
import { type GuestWithInvitations } from '~/server/domains/guest/guest.types'
import {
  type CreateHouseholdSchemaInput,
  type DeleteHouseholdSchemaInput,
  type GiftInputSchemaInput,
  type GuestPartyInputSchemaInput,
  type SearchHouseholdSchemaInput,
  type UpdateHouseholdSchemaInput,
} from '~/server/domains/household/household.validator'

/**
 * Core Household entity type
 */
export type Household = {
  id: string
  weddingId: string
  createdAt: Date
  updatedAt: Date
  address1: string | null
  address2: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  notes: string | null
}

/**
 * Household with guests included
 */
export type HouseholdWithGuests = Household & {
  guests: GuestWithInvitations[]
}

/**
 * Household with guests and gifts included
 */
export type HouseholdWithGuestsAndGifts = Household & {
  guests: GuestWithInvitations[]
  gifts: Gift[]
}

/**
 * Input types derived from Zod schemas (single source of truth)
 * These re-exports provide cleaner names and centralize type definitions
 */
export type GuestPartyInput = GuestPartyInputSchemaInput
export type GiftInput = GiftInputSchemaInput
export type CreateHouseholdInput = CreateHouseholdSchemaInput
export type UpdateHouseholdInput = UpdateHouseholdSchemaInput
export type DeleteHouseholdInput = DeleteHouseholdSchemaInput
export type SearchHouseholdInput = SearchHouseholdSchemaInput

/**
 * Search result type
 */
export type HouseholdSearchResult = {
  id: string
  guests: GuestWithInvitations[]
}
