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
export const submitRsvpSchema = z
  .object({
    rsvpResponses: z.array(rsvpResponseSchema),
    answersToQuestions: z.array(answerToQuestionSchema),
  })
  .superRefine((data, ctx) => {
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
  })

export type SubmitRsvpSchemaInput = z.infer<typeof submitRsvpSchema>

export const submitPublicRsvpSchema = submitRsvpSchema.extend({
  subUrl: z.string().min(1, 'Sub URL is required'),
  rsvpToken: z.string().uuid('Invalid RSVP token format'),
})

export type SubmitPublicRsvpSchemaInput = z.infer<typeof submitPublicRsvpSchema>
