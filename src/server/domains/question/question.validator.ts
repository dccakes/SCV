/**
 * Question Domain - Validators
 *
 * Zod schemas for validating question-related inputs.
 */

import { z } from 'zod'

/**
 * Schema for an option input
 */
export const optionInputSchema = z.object({
  id: z.string().optional(),
  questionId: z.string().optional(),
  responseCount: z.number().optional(),
  text: z.string().min(1, { message: 'Option should not be empty!' }),
  description: z.string().optional(),
})

/**
 * Schema for upserting a question
 */
export const upsertQuestionSchema = z.object({
  questionId: z.string().optional(),
  websiteId: z.string().optional().nullish(),
  eventId: z.string().optional().nullish(),
  text: z.string().min(1, { message: 'Question prompt should not be empty!' }),
  type: z.string(),
  isRequired: z.boolean().default(false),
  options: z
    .array(optionInputSchema)
    .min(2, {
      message: 'You need to have at least two options for this question!',
    })
    .optional(),
  deletedOptions: z.array(z.string()).optional(),
})

/**
 * Schema for deleting a question
 */
export const deleteQuestionSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
})

/**
 * Schema for question ID parameter
 */
export const questionIdSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
})

// Export inferred types
export type OptionInputSchemaInput = z.infer<typeof optionInputSchema>
export type UpsertQuestionSchemaInput = z.infer<typeof upsertQuestionSchema>
export type DeleteQuestionSchemaInput = z.infer<typeof deleteQuestionSchema>
export type QuestionIdSchemaInput = z.infer<typeof questionIdSchema>
