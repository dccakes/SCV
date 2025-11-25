/**
 * Event Domain - Barrel Export
 *
 * Exports all event domain components for use throughout the application.
 */

import { EventRepository } from '~/server/domains/event/event.repository'
import { EventService } from '~/server/domains/event/event.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instances
const eventRepository = new EventRepository(db)
export const eventService = new EventService(eventRepository, db)

// Export types
export type {
  CreateEventInput,
  DeleteEventInput,
  Event,
  EventWithQuestions,
  EventWithStats,
  UpdateCollectRsvpInput,
  UpdateEventInput,
} from '~/server/domains/event/event.types'

// Export validators
export {
  createEventSchema,
  type CreateEventSchemaInput,
  deleteEventSchema,
  type DeleteEventSchemaInput,
  eventIdSchema,
  updateCollectRsvpSchema,
  type UpdateCollectRsvpSchemaInput,
  updateEventSchema,
  type UpdateEventSchemaInput,
} from '~/server/domains/event/event.validator'

// Export classes for testing/DI
export { EventRepository } from '~/server/domains/event/event.repository'
export { EventService } from '~/server/domains/event/event.service'

// Export router
export { eventRouter } from '~/server/domains/event/event.router'
