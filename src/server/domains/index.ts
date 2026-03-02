/**
 * Domains Layer - Barrel Export
 *
 * Exports all domain routers and services for use throughout the application.
 * Each domain contains its own types, validators, repository, service, and router.
 */

// Event Domain
export {
  type CreateEventInput,
  type Event,
  type EventWithQuestions,
  type EventWithStats,
  eventRouter,
  eventService,
  type UpdateEventInput,
} from '~/server/domains/event'
// Gift Domain
export {
  type CreateGiftInput,
  type Gift,
  giftRouter,
  giftService,
  type UpdateGiftInput,
  type UpsertGiftInput,
} from '~/server/domains/gift'
// Guest Domain
export {
  type CreateGuestInput,
  type Guest,
  type GuestWithInvitations,
  guestRouter,
  guestService,
  type UpdateGuestInput,
} from '~/server/domains/guest'
// Household Domain
export {
  type CreateHouseholdInput,
  type DeleteHouseholdInput,
  type Household,
  type HouseholdSearchResult,
  type HouseholdWithGuests,
  type HouseholdWithGuestsAndGifts,
  householdRouter,
  type SearchHouseholdInput,
  type UpdateHouseholdInput,
} from '~/server/domains/household'
// Invitation Domain
export {
  type CreateInvitationInput,
  type Invitation,
  invitationRouter,
  invitationService,
  type RsvpStats,
  type UpdateInvitationInput,
} from '~/server/domains/invitation'
// Question Domain
export {
  type Answer,
  type DeleteQuestionInput,
  type Option,
  type OptionInput,
  type OptionResponse,
  type Question,
  type QuestionWithOptions,
  questionRouter,
  questionService,
  type UpsertQuestionInput,
} from '~/server/domains/question'
// User Domain
export {
  type CreateUserInput,
  type UpdateUserInput,
  type User,
  userRouter,
  userService,
} from '~/server/domains/user'
// Website Domain
export {
  type CreateWebsiteInput,
  type UpdateWebsiteInput,
  type Website,
  type WebsiteWithQuestions,
  type WeddingPageData,
  websiteRouter,
  websiteService,
} from '~/server/domains/website'
