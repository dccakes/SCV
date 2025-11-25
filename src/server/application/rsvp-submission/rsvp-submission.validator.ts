/**
 * RSVP Submission Application Service - Validators
 *
 * Zod schemas for validating RSVP form submissions.
 */

import { z } from 'zod'

/**
 * Schema for RSVP response (guest/event combination)
 */
export const rsvpResponseSchema = z.object({
  eventId: z.string(),
  guestId: z.number(),
  rsvp: z.string(),
})

export type RsvpResponseSchemaInput = z.infer<typeof rsvpResponseSchema>

/**
 * Schema for question answers
 */
export const answerToQuestionSchema = z.object({
  questionId: z.string(),
  questionType: z.string(),
  response: z.string(),
  guestId: z.number().nullish(),
  householdId: z.string().nullish(),
  selectedOptionId: z.string().optional(),
  guestFirstName: z.string().optional().nullish(),
  guestLastName: z.string().optional().nullish(),
})

export type AnswerToQuestionSchemaInput = z.infer<typeof answerToQuestionSchema>

/**
 * Schema for complete RSVP form submission
 */
export const submitRsvpSchema = z.object({
  rsvpResponses: z.array(rsvpResponseSchema),
  answersToQuestions: z.array(answerToQuestionSchema),
})

export type SubmitRsvpSchemaInput = z.infer<typeof submitRsvpSchema>
