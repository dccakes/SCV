/**
 * RSVP Submission Application Service - Barrel Export
 *
 * Exports all RSVP submission application service components.
 */

import { RsvpSubmissionService } from '~/server/application/rsvp-submission/rsvp-submission.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instance
export const rsvpSubmissionService = new RsvpSubmissionService(db)

// Export types
export type {
  AnswerToQuestion,
  RsvpResponse,
  RsvpSubmissionInput,
  RsvpSubmissionResult,
} from '~/server/application/rsvp-submission/rsvp-submission.types'

// Export validators
export {
  answerToQuestionSchema,
  type AnswerToQuestionSchemaInput,
  rsvpResponseSchema,
  type RsvpResponseSchemaInput,
  submitRsvpSchema,
  type SubmitRsvpSchemaInput,
} from '~/server/application/rsvp-submission/rsvp-submission.validator'

// Export classes for testing/DI
export { RsvpSubmissionService } from '~/server/application/rsvp-submission/rsvp-submission.service'

// Export router
export { rsvpSubmissionRouter } from '~/server/application/rsvp-submission/rsvp-submission.router'
