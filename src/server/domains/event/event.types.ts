/**
 * Event Domain - Types
 *
 * Type definitions for the Event domain entity.
 * Events represent wedding ceremonies, receptions, rehearsal dinners, etc.
 */

import type { Prisma } from '@prisma/client'

export type EventQuestion = Prisma.QuestionGetPayload<{
  include: {
    options: true
    _count: {
      select: { answers: true }
    }
  }
}>

/**
 * Core Event entity type
 */
/**
 * The main wedding event is identified by this English name; translated names
 * never replace it for matching.
 */
export const WEDDING_DAY_EVENT_NAME = 'Wedding Day'

/** The ceremony event created during onboarding, matched on its English name too. */
export const CEREMONY_EVENT_NAME = 'Ceremony'

export type Event = {
  id: string
  name: string
  date: Date | null
  startTime: string | null
  endTime: string | null
  venue: string | null
  attire: string | null
  description: string | null
  /** Locale overlays for name/venue/attire/description, e.g. { es: { name } }. */
  translations?: unknown
  weddingId: string
  collectRsvp: boolean
  allowTagAlongs: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Event with questions included
 */
export type EventWithQuestions = Event & {
  questions: EventQuestion[]
}

/**
 * Event with RSVP statistics
 */
export type EventWithStats = Event & {
  questions?: EventQuestion[]
  guestResponses: {
    attending: number
    invited: number
    declined: number
    notInvited: number
  }
  estimatedAttendance: number
}

/**
 * Input types are now derived from Zod schemas in event.validator.ts
 * Import them from there to maintain schema-first development pattern
 */
