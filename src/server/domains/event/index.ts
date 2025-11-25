/**
 * Event Domain - Barrel Export
 *
 * Exports all event domain components for use throughout the application.
 */

import { db } from '~/server/infrastructure/database'

import { EventRepository } from './event.repository'
import { EventService } from './event.service'

// Create singleton instances
const eventRepository = new EventRepository(db)
export const eventService = new EventService(eventRepository, db)

// Export types
export type {
  Event,
  EventWithQuestions,
  EventWithStats,
  CreateEventInput,
  UpdateEventInput,
  UpdateCollectRsvpInput,
  DeleteEventInput,
} from './event.types'

// Export validators
export {
  createEventSchema,
  updateEventSchema,
  updateCollectRsvpSchema,
  deleteEventSchema,
  eventIdSchema,
  type CreateEventSchemaInput,
  type UpdateEventSchemaInput,
  type UpdateCollectRsvpSchemaInput,
  type DeleteEventSchemaInput,
} from './event.validator'

// Export classes for testing/DI
export { EventRepository } from './event.repository'
export { EventService } from './event.service'

// Export router
export { eventRouter } from './event.router'
