/**
 * RSVP Submission Application Service - Barrel Export
 *
 * Exports all RSVP submission application service components.
 */

import { RsvpSubmissionService } from '~/server/application/rsvp-submission/rsvp-submission.service'
import { GuestRepository } from '~/server/domains/guest/guest.repository'
import { HouseholdRepository } from '~/server/domains/household/household.repository'
import { InvitationRepository } from '~/server/domains/invitation/invitation.repository'
import { QuestionRepository } from '~/server/domains/question/question.repository'
import { WeddingRepository } from '~/server/domains/wedding/wedding.repository'
import { db } from '~/server/infrastructure/database'

const invitationRepo = new InvitationRepository(db)
const questionRepo = new QuestionRepository(db)
const guestRepo = new GuestRepository(db)
const householdRepo = new HouseholdRepository(db)
const weddingRepo = new WeddingRepository(db)

export const rsvpSubmissionService = new RsvpSubmissionService(
  invitationRepo,
  questionRepo,
  guestRepo,
  householdRepo,
  weddingRepo,
  db
)

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
