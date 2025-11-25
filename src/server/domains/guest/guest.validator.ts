/**
 * Guest Domain - Validators
 *
 * Zod schemas for validating guest-related inputs.
 */

import { z } from 'zod'

/**
 * Schema for creating a guest
 */
export const createGuestSchema = z.object({
  firstName: z.string().nonempty({ message: 'First name required' }),
  lastName: z.string().nonempty({ message: 'Last name required' }),
  householdId: z.string().min(1, 'Household ID is required'),
  isPrimaryContact: z.boolean().optional().default(false),
})

/**
 * Schema for updating a guest
 */
export const updateGuestSchema = z.object({
  guestId: z.number(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

/**
 * Schema for guest ID
 */
export const guestIdSchema = z.object({
  guestId: z.number(),
})

/**
 * Schema for getting guests by household
 */
export const getByHouseholdSchema = z.object({
  householdId: z.string().min(1, 'Household ID is required'),
})

/**
 * Schema for getting guests by event
 */
export const getByEventSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
})

/**
 * Schema for guest party input (used in household operations)
 */
export const guestPartySchema = z.object({
  guestId: z.number().optional(),
  firstName: z.string().nonempty({ message: 'First name required' }),
  lastName: z.string().nonempty({ message: 'Last name required' }),
  invites: z.record(z.string(), z.string()),
})

// Export inferred types
export type CreateGuestSchemaInput = z.infer<typeof createGuestSchema>
export type UpdateGuestSchemaInput = z.infer<typeof updateGuestSchema>
export type GuestIdSchemaInput = z.infer<typeof guestIdSchema>
export type GetByHouseholdSchemaInput = z.infer<typeof getByHouseholdSchema>
export type GetByEventSchemaInput = z.infer<typeof getByEventSchema>
export type GuestPartySchemaInput = z.infer<typeof guestPartySchema>
