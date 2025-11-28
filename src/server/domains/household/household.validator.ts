/**
 * Household Domain - Validators
 *
 * Zod schemas for validating household-related inputs.
 */

import { z } from 'zod'

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
  phone: z.string().nullish().optional(),
  email: z.string().email({ message: 'Not a valid email' }).nullish().optional(),
  notes: z.string().nullish().optional(),
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
      // Ensure exactly one guest is marked as primary contact
      const primaryContacts = data.guestParty.filter((guest) => guest.isPrimaryContact)
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
      // Ensure exactly one guest is marked as primary contact
      const primaryContacts = data.guestParty.filter((guest) => guest.isPrimaryContact)
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
 * Schema for household ID parameter
 */
export const householdIdSchema = z.object({
  householdId: z.string().min(1, 'Household ID is required'),
})

// Export inferred types
export type GuestPartyInputSchemaInput = z.infer<typeof guestPartyInputSchema>
export type GiftInputSchemaInput = z.infer<typeof giftInputSchema>
export type CreateHouseholdSchemaInput = z.infer<typeof createHouseholdSchema>
export type UpdateHouseholdSchemaInput = z.infer<typeof updateHouseholdSchema>
export type DeleteHouseholdSchemaInput = z.infer<typeof deleteHouseholdSchema>
export type SearchHouseholdSchemaInput = z.infer<typeof searchHouseholdSchema>
export type HouseholdIdSchemaInput = z.infer<typeof householdIdSchema>
