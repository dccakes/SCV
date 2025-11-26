/**
 * Wedding Domain - Validators
 *
 * Zod schemas for validating wedding-related inputs.
 */

import { z } from 'zod'

/**
 * Schema for creating a new wedding (onboarding)
 */
export const createWeddingSchema = z.object({
  groomFirstName: z.string().min(1, 'Groom first name is required'),
  groomMiddleName: z.string().optional(),
  groomLastName: z.string().min(1, 'Groom last name is required'),
  brideFirstName: z.string().min(1, 'Bride first name is required'),
  brideMiddleName: z.string().optional(),
  brideLastName: z.string().min(1, 'Bride last name is required'),
  hasWeddingDetails: z.boolean().optional(),
  weddingDate: z.string().optional(),
  weddingLocation: z.string().optional(),
})

/**
 * Schema for updating wedding settings
 */
export const updateWeddingSchema = z.object({
  groomFirstName: z.string().min(1).optional(),
  groomLastName: z.string().min(1).optional(),
  brideFirstName: z.string().min(1).optional(),
  brideLastName: z.string().min(1).optional(),
  enabledAddOns: z.array(z.string()).optional(),
})

/**
 * Schema for fetching wedding by userId
 */
export const getByUserIdSchema = z
  .object({
    userId: z.string().optional(),
  })
  .optional()

// Export inferred types
export type CreateWeddingSchemaInput = z.infer<typeof createWeddingSchema>
export type UpdateWeddingSchemaInput = z.infer<typeof updateWeddingSchema>
