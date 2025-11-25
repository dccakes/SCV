/**
 * Domains Layer - Barrel Export
 *
 * Exports all domain routers and services for use throughout the application.
 * Each domain contains its own types, validators, repository, service, and router.
 */

// User Domain
export { userRouter, userService, type User, type CreateUserInput, type UpdateUserInput } from './user'

// Website Domain
export {
  websiteRouter,
  websiteService,
  type Website,
  type WebsiteWithQuestions,
  type CreateWebsiteInput,
  type UpdateWebsiteInput,
  type WeddingPageData,
} from './website'

// Event Domain
export {
  eventRouter,
  eventService,
  type Event,
  type EventWithQuestions,
  type EventWithStats,
  type CreateEventInput,
  type UpdateEventInput,
} from './event'
