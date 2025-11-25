/**
 * Gift Domain - Validators
 *
 * Zod schemas for validating gift-related inputs.
 */

import { z } from 'zod'

/**
 * Schema for updating a gift
 */
export const updateGiftSchema = z.object({
  householdId: z.string().min(1, 'Household ID is required'),
  eventId: z.string().min(1, 'Event ID is required'),
  description: z.string().optional(),
  thankyou: z.boolean(),
})

/**
 * Schema for creating a gift
 */
export const createGiftSchema = z.object({
  householdId: z.string().min(1, 'Household ID is required'),
  eventId: z.string().min(1, 'Event ID is required'),
  description: z.string().optional(),
  thankyou: z.boolean().default(false),
})

/**
 * Schema for upserting a gift
 */
export const upsertGiftSchema = z.object({
  householdId: z.string().min(1, 'Household ID is required'),
  eventId: z.string().min(1, 'Event ID is required'),
  description: z.string().optional().nullish(),
  thankyou: z.boolean(),
})

/**
 * Schema for gift ID (compound key)
 */
export const giftIdSchema = z.object({
  householdId: z.string().min(1, 'Household ID is required'),
  eventId: z.string().min(1, 'Event ID is required'),
})

// Export inferred types
export type UpdateGiftSchemaInput = z.infer<typeof updateGiftSchema>
export type CreateGiftSchemaInput = z.infer<typeof createGiftSchema>
export type UpsertGiftSchemaInput = z.infer<typeof upsertGiftSchema>
export type GiftIdSchemaInput = z.infer<typeof giftIdSchema>
