/**
 * Household Domain - Validators
 *
 * Zod schemas for validating household-related inputs.
 */

import { z } from 'zod'

import { optionalPhoneSchema } from '~/lib/phone/phone-validator'
import { guestPartySchema } from '~/server/domains/guest/guest.validator'

/**
 * Re-export guest party schema for convenience
 * (Canonical definition is in guest.validator.ts)
 */
export const guestPartyInputSchema = guestPartySchema

/**
 * Schema for gift input
 */
export const giftInputSchema = z.object({
  eventId: z.string(),
  thankyou: z.boolean(),
  description: z.string().optional().nullish(),
})

/**
 * Base household fields (address, contact info, notes)
 * Shared across create, update, and form schemas
 */
export const baseHouseholdFields = z.object({
  address1: z.string().nullish().optional(),
  address2: z.string().nullish().optional(),
  city: z.string().nullish().optional(),
  state: z.string().nullish().optional(),
  country: z.string().nullish().optional(),
  zipCode: z.string().nullish().optional(),
  phone: optionalPhoneSchema,
  email: z.string().email({ message: 'Not a valid email' }).nullish().optional(),
  notes: z.string().nullish().optional(),
  likelihoodOfAttending: z.number().int().min(1).max(5).nullish().optional(),
})

/**
 * Schema for creating a household
 */
export const createHouseholdSchema = baseHouseholdFields
  .extend({
    guestParty: z.array(guestPartyInputSchema).min(1, 'At least one guest is required'),
  })
  .refine(
    (data) => {
      // Ensure exactly one non-tag-along guest is marked as primary contact
      const invitedGuests = data.guestParty.filter((guest) => !guest.isTagAlong)
      const primaryContacts = invitedGuests.filter((guest) => guest.isPrimaryContact)
      return primaryContacts.length === 1
    },
    {
      message: 'Exactly one guest must be marked as primary contact',
      path: ['guestParty'],
    }
  )

/**
 * Schema for updating a household
 */
export const updateHouseholdSchema = baseHouseholdFields
  .extend({
    householdId: z.string().min(1, 'Household ID is required'),
    guestParty: z.array(guestPartyInputSchema).min(1, 'At least one guest is required'),
    deletedGuests: z.array(z.number()).optional(),
    gifts: z.array(giftInputSchema),
  })
  .refine(
    (data) => {
      // Ensure exactly one non-tag-along guest is marked as primary contact
      const invitedGuests = data.guestParty.filter((guest) => !guest.isTagAlong)
      const primaryContacts = invitedGuests.filter((guest) => guest.isPrimaryContact)
      return primaryContacts.length === 1
    },
    {
      message: 'Exactly one guest must be marked as primary contact',
      path: ['guestParty'],
    }
  )

/**
 * Schema for deleting a household
 */
export const deleteHouseholdSchema = z.object({
  householdId: z.string().min(1, 'Household ID is required'),
})

/**
 * Schema for searching households
 */
export const searchHouseholdSchema = z.object({
  searchText: z.string().min(2, { message: 'Search input should be minimum 2 characters' }),
})

/**
 * Schema for searching households from the public guest-facing RSVP flow.
 * Scoped to a wedding via the website's subUrl since the guest is unauthenticated.
 */
export const publicSearchHouseholdSchema = z.object({
  subUrl: z.string().min(1, { message: 'Wedding website is required' }),
  searchText: z.string().min(2, { message: 'Search input should be minimum 2 characters' }),
})

/**
 * Schema for household ID parameter
 */
export const householdIdSchema = z.object({
  householdId: z.string().min(1, 'Household ID is required'),
})

/**
 * Schema for bulk creating multiple households (CSV import)
 */
export const bulkCreateHouseholdsSchema = z.object({
  households: z
    .array(createHouseholdSchema)
    .min(1, 'At least one household is required')
    .max(500, 'Cannot import more than 500 households at once'),
})

// Export inferred types
export type GuestPartyInputSchemaInput = z.infer<typeof guestPartyInputSchema>
export type GiftInputSchemaInput = z.infer<typeof giftInputSchema>
export type CreateHouseholdSchemaInput = z.infer<typeof createHouseholdSchema>
export type UpdateHouseholdSchemaInput = z.infer<typeof updateHouseholdSchema>
export type DeleteHouseholdSchemaInput = z.infer<typeof deleteHouseholdSchema>
export type SearchHouseholdSchemaInput = z.infer<typeof searchHouseholdSchema>
export type PublicSearchHouseholdSchemaInput = z.infer<typeof publicSearchHouseholdSchema>
export type HouseholdIdSchemaInput = z.infer<typeof householdIdSchema>
export type BulkCreateHouseholdsSchemaInput = z.infer<typeof bulkCreateHouseholdsSchema>
