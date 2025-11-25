/**
 * Event Domain - Types
 *
 * Type definitions for the Event domain entity.
 * Events represent wedding ceremonies, receptions, rehearsal dinners, etc.
 */

import { type Question, type Option } from '~/app/utils/shared-types'

/**
 * Core Event entity type
 */
export type Event = {
  id: string
  name: string
  date: Date | null
  startTime: string | null
  endTime: string | null
  venue: string | null
  attire: string | null
  description: string | null
  userId: string
  collectRsvp: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Event with questions included
 */
export type EventWithQuestions = Event & {
  questions: Array<
    Question & {
      options?: Option[]
      _count?: { answers: number }
    }
  >
}

/**
 * Event with RSVP statistics
 */
export type EventWithStats = Event & {
  guestResponses: {
    attending: number
    invited: number
    declined: number
    notInvited: number
  }
}

/**
 * Input for creating a new event
 */
export type CreateEventInput = {
  eventName: string
  date?: string
  startTime?: string
  endTime?: string
  venue?: string
  attire?: string
  description?: string
}

/**
 * Input for updating an existing event
 */
export type UpdateEventInput = {
  eventId: string
  eventName: string
  date?: string
  startTime?: string
  endTime?: string
  venue?: string
  attire?: string
  description?: string
}

/**
 * Input for updating collect RSVP status
 */
export type UpdateCollectRsvpInput = {
  eventId: string
  collectRsvp: boolean
}

/**
 * Input for deleting an event
 */
export type DeleteEventInput = {
  eventId: string
}
