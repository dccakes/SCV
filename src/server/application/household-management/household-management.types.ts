/**
 * Household Management Application Service - Types
 *
 * Types for complex household management operations that span multiple domains.
 */

import { type Gift } from '~/server/domains/gift'
import { type GuestWithInvitations } from '~/server/domains/guest'
import { type Invitation } from '~/server/domains/invitation'

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
  guestParty: Array<{
    firstName: string
    lastName: string
    invites: Record<string, string> // eventId -> rsvp status
  }>
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
  guestParty: Array<{
    guestId?: number
    firstName: string
    lastName: string
    invites: Record<string, string> // eventId -> rsvp status
  }>
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
