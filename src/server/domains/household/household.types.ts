/**
 * Household Domain - Types
 *
 * Type definitions for the Household domain entity.
 * Households represent guest groups/families sharing an address.
 */

import { type Gift } from '~/server/domains/gift/gift.types'
import { type GuestWithInvitations } from '~/server/domains/guest/guest.types'

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
 * Guest party input for household creation/update
 */
export type GuestPartyInput = {
  guestId?: number
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  invites: Record<string, string> // eventId -> rsvp status
}

/**
 * Gift input for household update
 */
export type GiftInput = {
  eventId: string
  thankyou: boolean
  description?: string | null
}

/**
 * Input for creating a household with guests
 */
export type CreateHouseholdInput = {
  guestParty: GuestPartyInput[]
  address1?: string | null
  address2?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  zipCode?: string | null
  notes?: string | null
}

/**
 * Input for updating a household with guests
 */
export type UpdateHouseholdInput = {
  householdId: string
  guestParty: GuestPartyInput[]
  address1?: string | null
  address2?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  zipCode?: string | null
  notes?: string | null
  deletedGuests?: number[]
  gifts: GiftInput[]
}

/**
 * Input for deleting a household
 */
export type DeleteHouseholdInput = {
  householdId: string
}

/**
 * Input for searching households
 */
export type SearchHouseholdInput = {
  searchText: string
}

/**
 * Search result type
 */
export type HouseholdSearchResult = {
  id: string
  guests: GuestWithInvitations[]
}
