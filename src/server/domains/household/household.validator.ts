/**
 * Household Domain - Validators
 *
 * Zod schemas for validating household-related inputs.
 */

import { z } from 'zod'

/**
 * Schema for guest party input
 */
export const guestPartyInputSchema = z.object({
  guestId: z.number().optional(),
  firstName: z.string().nonempty({ message: 'First name required' }),
  lastName: z.string().nonempty({ message: 'Last name required' }),
  invites: z.record(z.string(), z.string()),
})

/**
 * Schema for gift input
 */
export const giftInputSchema = z.object({
  eventId: z.string(),
  thankyou: z.boolean(),
  description: z.string().optional().nullish(),
})

/**
 * Schema for creating a household
 */
export const createHouseholdSchema = z.object({
  guestParty: z.array(guestPartyInputSchema),
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
 * Schema for updating a household
 */
export const updateHouseholdSchema = z.object({
  householdId: z.string().min(1, 'Household ID is required'),
  guestParty: z.array(guestPartyInputSchema),
  address1: z.string().nullish().optional(),
  address2: z.string().nullish().optional(),
  city: z.string().nullish().optional(),
  state: z.string().nullish().optional(),
  country: z.string().nullish().optional(),
  zipCode: z.string().nullish().optional(),
  phone: z.string().nullish().optional(),
  email: z.string().email({ message: 'Not a valid email' }).nullish().optional(),
  notes: z.string().nullish().optional(),
  deletedGuests: z.array(z.number()).optional(),
  gifts: z.array(giftInputSchema),
})

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
