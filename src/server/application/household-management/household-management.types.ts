/**
 * Household Management Application Service - Types
 *
 * Types for complex household management operations that span multiple domains.
 */

import { type Gift } from '~/server/domains/gift'
import { type GuestWithInvitations } from '~/server/domains/guest'
import { type GuestPartyInput as DomainGuestPartyInput } from '~/server/domains/household'
import { type Invitation } from '~/server/domains/invitation'

/**
 * Guest party input with optional fields for creation
 * Based on domain GuestPartyInput but with optional isPrimaryContact for flexibility
 */
export type GuestPartyInput = Omit<
  DomainGuestPartyInput,
  'isPrimaryContact' | 'ageGroup' | 'tagIds'
> & {
  isPrimaryContact?: boolean
  ageGroup?: 'INFANT' | 'CHILD' | 'TEEN' | 'ADULT'
  tagIds?: string[]
}

/**
 * Input for creating a household with guests
 */
export type CreateHouseholdWithGuestsInput = {
  address1?: string | null
  address2?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  zipCode?: string | null
  notes?: string | null
  guestParty: GuestPartyInput[]
}

/**
 * Input for updating a household with guests
 */
export type UpdateHouseholdWithGuestsInput = {
  householdId: string
  address1?: string | null
  address2?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  zipCode?: string | null
  notes?: string | null
  guestParty: GuestPartyInput[]
  deletedGuests?: number[]
  gifts: Array<{
    eventId: string
    description?: string | null
    thankyou?: boolean
  }>
}

/**
 * Result of creating a household with guests
 */
export type CreateHouseholdResult = {
  household: {
    id: string
    address1: string | null
    address2: string | null
    city: string | null
    state: string | null
    country: string | null
    zipCode: string | null
    notes: string | null
    gifts: Gift[]
  }
  guests: GuestWithInvitations[]
}

/**
 * Result of updating a household with guests
 */
export type UpdateHouseholdResult = {
  household: {
    id: string
    address1: string | null
    address2: string | null
    city: string | null
    state: string | null
    country: string | null
    zipCode: string | null
    notes: string | null
  }
  guests: Array<{
    id: number
    firstName: string
    lastName: string
    isPrimaryContact: boolean
    householdId: string
    weddingId: string
    invitations: Invitation[]
  }>
  gifts: Gift[]
}
