/**
 * Household Management Application Service - Validators
 *
 * Zod schemas for validating complex household management operations.
 */

import { z } from 'zod'

/**
 * Guest party input schema for household creation/update
 */
export const guestPartyInputSchema = z.object({
  guestId: z.number().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().nullish().or(z.literal('')),
  phone: z.string().nullish(),
  isPrimaryContact: z.boolean().optional(),
  ageGroup: z.enum(['INFANT', 'CHILD', 'TEEN', 'ADULT']).default('ADULT'),
  tagIds: z.array(z.string().uuid()).max(10, 'Maximum 10 tags allowed').default([]),
  invites: z.record(z.string()), // eventId -> rsvp status
})

export type GuestPartyInputSchemaInput = z.infer<typeof guestPartyInputSchema>

/**
 * Gift input schema for household update
 */
export const giftInputSchema = z.object({
  eventId: z.string(),
  description: z.string().nullish(),
  thankyou: z.boolean().optional(),
})

export type GiftInputSchemaInput = z.infer<typeof giftInputSchema>

/**
 * Create household with guests schema
 */
export const createHouseholdWithGuestsSchema = z.object({
  address1: z.string().nullish(),
  address2: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  country: z.string().nullish(),
  zipCode: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().email().nullish().or(z.literal('')),
  notes: z.string().nullish(),
  guestParty: z.array(guestPartyInputSchema).min(1, 'At least one guest is required'),
})

export type CreateHouseholdWithGuestsSchemaInput = z.infer<typeof createHouseholdWithGuestsSchema>

/**
 * Update household with guests schema
 */
export const updateHouseholdWithGuestsSchema = z.object({
  householdId: z.string(),
  address1: z.string().nullish(),
  address2: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  country: z.string().nullish(),
  zipCode: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().email().nullish().or(z.literal('')),
  notes: z.string().nullish(),
  guestParty: z.array(guestPartyInputSchema).min(1, 'At least one guest is required'),
  deletedGuests: z.array(z.number()).optional(),
  gifts: z.array(giftInputSchema),
})

export type UpdateHouseholdWithGuestsSchemaInput = z.infer<typeof updateHouseholdWithGuestsSchema>

/**
 * Delete household schema
 */
export const deleteHouseholdSchema = z.object({
  householdId: z.string(),
})

export type DeleteHouseholdSchemaInput = z.infer<typeof deleteHouseholdSchema>
