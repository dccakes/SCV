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
  eventService,
  type EventWithQuestions,
  type EventWithStats,
  type UpdateEventInput,
} from '~/server/domains/event'

// User Domain
export {
  type CreateUserInput,
  type UpdateUserInput,
  type User,
  userService,
} from '~/server/domains/user'

// Website Domain
export {
  type CreateWebsiteInput,
  type UpdateWebsiteInput,
  type Website,
  websiteService,
  type WebsiteWithQuestions,
  type WeddingPageData,
} from '~/server/domains/website'

// Gift Domain
export {
  type CreateGiftInput,
  type Gift,
  giftService,
  type UpdateGiftInput,
  type UpsertGiftInput,
} from '~/server/domains/gift'

// Guest Domain
export {
  type CreateGuestInput,
  type Guest,
  guestService,
  type GuestWithInvitations,
  type UpdateGuestInput,
} from '~/server/domains/guest'

// Invitation Domain
export {
  type CreateInvitationInput,
  type Invitation,
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
  questionService,
  type QuestionWithOptions,
  type UpsertQuestionInput,
} from '~/server/domains/question'

// Household Domain
export {
  type CreateHouseholdInput,
  type DeleteHouseholdInput,
  type Household,
  type HouseholdSearchResult,
  type HouseholdWithGuests,
  type HouseholdWithGuestsAndGifts,
  type SearchHouseholdInput,
  type UpdateHouseholdInput,
} from '~/server/domains/household'
