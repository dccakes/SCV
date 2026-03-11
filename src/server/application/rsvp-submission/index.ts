/**
 * RSVP Submission Application Service - Barrel Export
 *
 * Exports all RSVP submission application service components.
 */

import { RsvpSubmissionService } from '~/server/application/rsvp-submission/rsvp-submission.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instance
export const rsvpSubmissionService = new RsvpSubmissionService(db)

// Export router
export { rsvpSubmissionRouter } from '~/server/application/rsvp-submission/rsvp-submission.router'
// Export classes for testing/DI
export { RsvpSubmissionService } from '~/server/application/rsvp-submission/rsvp-submission.service'
// Export types
export type {
  AnswerToQuestion,
  RsvpResponse,
  RsvpSubmissionInput,
  RsvpSubmissionResult,
} from '~/server/application/rsvp-submission/rsvp-submission.types'
// Export validators
export {
  type AnswerToQuestionSchemaInput,
  answerToQuestionSchema,
  type RsvpResponseSchemaInput,
  rsvpResponseSchema,
  type SubmitPublicRsvpSchemaInput,
  type SubmitRsvpSchemaInput,
  submitPublicRsvpSchema,
  submitRsvpSchema,
} from '~/server/application/rsvp-submission/rsvp-submission.validator'
