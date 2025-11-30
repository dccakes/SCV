/**
 * Guest Domain - Validators
 *
 * Zod schemas for validating guest-related inputs.
 */

import { GuestAgeGroup } from '@prisma/client'
import { z } from 'zod'

/**
 * Schema for creating a guest
 */
export const createGuestSchema = z.object({
  firstName: z.string().nonempty({ message: 'First name required' }),
  lastName: z.string().nonempty({ message: 'Last name required' }),
  email: z.string().email('Valid email required').optional().nullable(),
  phone: z.string().optional().nullable(),
  householdId: z.string().min(1, 'Household ID is required'),
  isPrimaryContact: z.boolean().optional().default(false),
  ageGroup: z.nativeEnum(GuestAgeGroup).default(GuestAgeGroup.ADULT),
  tagIds: z.array(z.string().uuid()).max(10, 'Maximum 10 tags allowed').optional().default([]),
})

/**
 * Schema for updating a guest
 */
export const updateGuestSchema = z.object({
  guestId: z.number(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Valid email required').optional().nullable(),
  phone: z.string().optional().nullable(),
  ageGroup: z.nativeEnum(GuestAgeGroup).optional(),
  tagIds: z.array(z.string().uuid()).max(10, 'Maximum 10 tags allowed').optional(),
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
 * This is the canonical schema for guest data in multi-guest contexts
 */
export const guestPartySchema = z.object({
  guestId: z.number().optional(),
  firstName: z.string().nonempty({ message: 'First name required' }),
  lastName: z.string().nonempty({ message: 'Last name required' }),
  email: z.string().email('Valid email required').optional().nullable(),
  phone: z.string().optional().nullable(),
  isPrimaryContact: z.boolean().default(false),
  ageGroup: z.nativeEnum(GuestAgeGroup).default(GuestAgeGroup.ADULT),
  tagIds: z.array(z.string().uuid()).max(10, 'Maximum 10 tags allowed').default([]),
  invites: z.record(z.string(), z.string()),
})

// Export inferred types
export type CreateGuestSchemaInput = z.infer<typeof createGuestSchema>
export type UpdateGuestSchemaInput = z.infer<typeof updateGuestSchema>
export type GuestIdSchemaInput = z.infer<typeof guestIdSchema>
export type GetByHouseholdSchemaInput = z.infer<typeof getByHouseholdSchema>
export type GetByEventSchemaInput = z.infer<typeof getByEventSchema>
export type GuestPartySchemaInput = z.infer<typeof guestPartySchema>
