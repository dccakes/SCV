/**
 * RSVP Submission Application Service - Validators
 *
 * Zod schemas for validating RSVP form submissions.
 */

import { z } from 'zod'
import { dietaryRestrictionsPayloadSchema } from '~/server/domains/guest/guest.validator'

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
  response: z.string().max(1000),
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
  rsvpResponses: z.array(rsvpResponseSchema).max(200),
  answersToQuestions: z.array(answerToQuestionSchema).max(500),
  guestDietaryResponses: z
    .array(
      z.object({
        guestId: z.number(),
        dietaryRestrictions: dietaryRestrictionsPayloadSchema,
      })
    )
    .max(200)
    .optional()
    .default([]),
})

export type SubmitRsvpSchemaInput = z.infer<typeof submitRsvpSchema>

export const submitPublicRsvpSchema = submitRsvpSchema.extend({
  subUrl: z.string().min(1, 'Sub URL is required'),
  token: z.string().regex(/^[a-f0-9]{32}$/, 'Invalid RSVP token format'),
})

export type SubmitPublicRsvpSchemaInput = z.infer<typeof submitPublicRsvpSchema>
