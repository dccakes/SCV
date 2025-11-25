/**
 * Event Domain - Validators
 *
 * Zod schemas for validating event-related inputs.
 */

import { z } from 'zod'

/**
 * Schema for creating a new event
 */
export const createEventSchema = z.object({
  eventName: z.string().min(1, { message: 'Event name required' }),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venue: z.string().optional(),
  attire: z.string().optional(),
  description: z.string().optional(),
})

/**
 * Schema for updating an existing event
 */
export const updateEventSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  eventName: z.string().min(1, { message: 'Event name required' }),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venue: z.string().optional(),
  attire: z.string().optional(),
  description: z.string().optional(),
})

/**
 * Schema for updating collect RSVP status
 */
export const updateCollectRsvpSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  collectRsvp: z.boolean(),
})

/**
 * Schema for deleting an event
 */
export const deleteEventSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
})

/**
 * Schema for event ID parameter
 */
export const eventIdSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
})

// Export inferred types
export type CreateEventSchemaInput = z.infer<typeof createEventSchema>
export type UpdateEventSchemaInput = z.infer<typeof updateEventSchema>
export type UpdateCollectRsvpSchemaInput = z.infer<typeof updateCollectRsvpSchema>
export type DeleteEventSchemaInput = z.infer<typeof deleteEventSchema>
