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
  eventRouter,
  eventService,
  type EventWithQuestions,
  type EventWithStats,
  type UpdateEventInput,
} from '~/server/domains/event'

// User Domain
export { type CreateUserInput, type UpdateUserInput, type User, userRouter, userService } from '~/server/domains/user'

// Website Domain
export {
  type CreateWebsiteInput,
  type UpdateWebsiteInput,
  type Website,
  websiteRouter,
  websiteService,
  type WebsiteWithQuestions,
  type WeddingPageData,
} from '~/server/domains/website'
