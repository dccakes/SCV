/**
 * Communication Log Domain - Validators
 *
 * Zod schemas for validating communication log inputs.
 */

import { z } from 'zod'

/**
 * Schema for querying communication log by household ID
 */
export const getByHouseholdIdSchema = z.object({
  householdId: z.string().min(1, 'Household ID is required'),
})

/**
 * Schema for adding a manual note to a household's communication log
 */
export const addNoteSchema = z.object({
  householdId: z.string().min(1, 'Household ID is required'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message must be 2000 characters or fewer'),
})

/**
 * Schema for deleting a manual note
 */
export const deleteNoteSchema = z.object({
  noteId: z.string().min(1, 'Note ID is required'),
})

// Export inferred types
export type GetByHouseholdIdSchemaInput = z.infer<typeof getByHouseholdIdSchema>
export type AddNoteSchemaInput = z.infer<typeof addNoteSchema>
export type DeleteNoteSchemaInput = z.infer<typeof deleteNoteSchema>
