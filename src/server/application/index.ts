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
  DashboardService,
  dashboardRouter,
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
  type CreateHouseholdWithGuestsSchemaInput,
  createHouseholdWithGuestsSchema,
  type DeleteHouseholdSchemaInput,
  deleteHouseholdSchema,
  type GiftInputSchemaInput,
  type GuestPartyInputSchemaInput,
  giftInputSchema,
  guestPartyInputSchema,
  HouseholdManagementService,
  householdManagementService,
  type UpdateHouseholdResult,
  type UpdateHouseholdWithGuestsInput,
  type UpdateHouseholdWithGuestsSchemaInput,
  updateHouseholdWithGuestsSchema,
} from '~/server/application/household-management'

// RSVP Submission Application Service
export {
  type AnswerToQuestion,
  type AnswerToQuestionSchemaInput,
  answerToQuestionSchema,
  type RsvpResponse,
  type RsvpResponseSchemaInput,
  type RsvpSubmissionInput,
  type RsvpSubmissionResult,
  RsvpSubmissionService,
  rsvpResponseSchema,
  rsvpSubmissionRouter,
  rsvpSubmissionService,
  type SubmitRsvpSchemaInput,
  submitRsvpSchema,
} from '~/server/application/rsvp-submission'
