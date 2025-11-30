/**
 * Application Layer - Barrel Export
 *
 * Exports all application services and routers.
 * Application services orchestrate multiple domain services for complex workflows.
 */

// Dashboard Application Service
export {
  type Answer,
  type DashboardData,
  dashboardRouter,
  DashboardService,
  dashboardService,
  type EventWithStats,
  type GuestResponses,
  type GuestWithInvitations,
  type HouseholdWithGuests,
  type QuestionWithRecentAnswer,
  type WebsiteWithQuestions,
  type WeddingData,
  type WeddingDate,
} from '~/server/application/dashboard'

// Household Management Application Service
export {
  type CreateHouseholdResult,
  type CreateHouseholdWithGuestsInput,
  createHouseholdWithGuestsSchema,
  type CreateHouseholdWithGuestsSchemaInput,
  deleteHouseholdSchema,
  type DeleteHouseholdSchemaInput,
  giftInputSchema,
  type GiftInputSchemaInput,
  guestPartyInputSchema,
  type GuestPartyInputSchemaInput,
  HouseholdManagementService,
  householdManagementService,
  type UpdateHouseholdResult,
  type UpdateHouseholdWithGuestsInput,
  updateHouseholdWithGuestsSchema,
  type UpdateHouseholdWithGuestsSchemaInput,
} from '~/server/application/household-management'

// RSVP Submission Application Service
export {
  type AnswerToQuestion,
  answerToQuestionSchema,
  type AnswerToQuestionSchemaInput,
  type RsvpResponse,
  rsvpResponseSchema,
  type RsvpResponseSchemaInput,
  type RsvpSubmissionInput,
  type RsvpSubmissionResult,
  rsvpSubmissionRouter,
  RsvpSubmissionService,
  rsvpSubmissionService,
  submitRsvpSchema,
  type SubmitRsvpSchemaInput,
} from '~/server/application/rsvp-submission'
