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
  }
}> & {
  _count?: {
    answers: number
  }
}

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
  weddingId: string
  collectRsvp: boolean
  allowTagAlongs: boolean
  servesMeals?: boolean
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
