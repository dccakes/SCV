/**
 * Guest Form Schema
 *
 * Reuses server-side validation schemas from household domain.
 * Extends baseHouseholdFields with form-specific additions for unified create/edit mode.
 */

import { z } from 'zod'

import {
  baseHouseholdFields,
  giftInputSchema,
  guestPartyInputSchema,
} from '~/server/domains/household/household.validator'

/**
 * Base form schema (without validation refinement for cleaner types)
 * Extends server's baseHouseholdFields with form-specific fields:
 * - householdId: empty string for create mode, actual ID for edit mode
 * - gifts: always present (empty array for create, populated for edit)
 * - deletedGuests: tracks guest IDs to be deleted (edit mode only)
 */
const baseHouseholdFormSchema = baseHouseholdFields.extend({
  householdId: z.string().default(''),
  guestParty: z.array(guestPartyInputSchema).min(1, 'At least one guest is required'),
  gifts: z.array(giftInputSchema).default([]),
  deletedGuests: z.array(z.number()).default([]), // Track deleted guest IDs
})

/**
 * Full form schema with primary contact validation
 * Reuses validation logic from server-side household validators
 */
export const HouseholdFormSchema = baseHouseholdFormSchema.refine(
  (data) => {
    // Ensure exactly one guest is marked as primary contact
    const primaryContacts = data.guestParty.filter((guest) => guest.isPrimaryContact)
    return primaryContacts.length === 1
  },
  {
    message: 'Exactly one guest must be marked as primary contact',
    path: ['guestParty'],
  }
)

// Export types - use refined schema for type inference
export type HouseholdFormData = z.infer<typeof HouseholdFormSchema>
export type GuestFormData = z.infer<typeof guestPartyInputSchema>
export type GiftFormData = z.infer<typeof giftInputSchema>

/**
 * Helper to get default form values for creating a new household
 */
export const getDefaultHouseholdFormData = (events: Array<{ id: string }>): HouseholdFormData => {
  const invites: Record<string, string> = {}
  const gifts: GiftFormData[] = []

  events.forEach((event) => {
    invites[event.id] = 'Not Invited'
    gifts.push({
      eventId: event.id,
      thankyou: false,
      description: null,
    })
  })

  return {
    householdId: '',
    address1: null,
    address2: null,
    city: null,
    state: null,
    country: null,
    zipCode: null,
    phone: null,
    email: null,
    notes: null,
    gifts,
    deletedGuests: [],
    guestParty: [
      {
        firstName: '',
        lastName: '',
        email: null,
        phone: null,
        isPrimaryContact: true,
        invites,
      },
    ],
  }
}
