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
const submitRsvpBaseSchema = z.object({
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

const checkUniqueSubmissionItems = (
  data: z.infer<typeof submitRsvpBaseSchema>,
  ctx: z.RefinementCtx
): void => {
  const rsvpKeys = new Set<string>()
  data.rsvpResponses.forEach((response, index) => {
    const key = `${response.eventId}:${response.guestId}`
    if (rsvpKeys.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duplicate RSVP response for the same guest and event',
        path: ['rsvpResponses', index],
      })
      return
    }
    rsvpKeys.add(key)
  })

  const answerKeys = new Set<string>()
  data.answersToQuestions.forEach((answer, index) => {
    const key = `${answer.questionId}:${answer.guestId ?? -1}:${answer.householdId ?? '-1'}`
    if (answerKeys.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duplicate question answer for the same question and guest/household',
        path: ['answersToQuestions', index],
      })
      return
    }
    answerKeys.add(key)
  })
}

export const submitRsvpSchema = submitRsvpBaseSchema.superRefine(checkUniqueSubmissionItems)

export type SubmitRsvpSchemaInput = z.infer<typeof submitRsvpSchema>

export const submitPublicRsvpSchema = submitRsvpBaseSchema
  .extend({
    subUrl: z.string().min(1, 'Sub URL is required'),
    token: z.string().regex(/^[a-f0-9]{32}$/, 'Invalid RSVP token format'),
  })
  .superRefine(checkUniqueSubmissionItems)

export type SubmitPublicRsvpSchemaInput = z.infer<typeof submitPublicRsvpSchema>
