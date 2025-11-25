/**
 * Dashboard Application Service - Types
 *
 * Types for the dashboard overview data that aggregates multiple domains.
 */

import { type Gift } from '~/server/domains/gift'
import { type Invitation } from '~/server/domains/invitation'
import { type Option, type Question } from '~/server/domains/question'

/**
 * Wedding date format
 */
export type WeddingDate = {
  standardFormat?: string
  numberFormat?: string
}

/**
 * Wedding data for dashboard header
 */
export type WeddingData = {
  website: WebsiteWithQuestions
  groomFirstName: string | null
  groomLastName: string | null
  brideFirstName: string | null
  brideLastName: string | null
  date: WeddingDate
  daysRemaining: number
}

/**
 * Website with general questions
 */
export type WebsiteWithQuestions = {
  id: string
  userId: string
  url: string
  subUrl: string
  groomFirstName: string | null
  groomLastName: string | null
  brideFirstName: string | null
  brideLastName: string | null
  isPasswordEnabled: boolean
  password: string | null
  coverPhotoUrl: string | null
  isRsvpEnabled: boolean
  generalQuestions: QuestionWithRecentAnswer[]
}

/**
 * Question with options and recent answer
 */
export type QuestionWithRecentAnswer = Question & {
  options: Option[]
  _count: { answers: number }
  recentAnswer: Answer | null
}

/**
 * Answer type for recent answers
 */
export type Answer = {
  id: string
  questionId: string
  guestId: number
  guestFirstName: string | null
  guestLastName: string | null
  householdId: string
  response: string
  createdAt: Date
}

/**
 * Guest with invitations for dashboard
 */
export type GuestWithInvitations = {
  id: number
  firstName: string
  lastName: string
  isPrimaryContact: boolean
  householdId: string
  userId: string
  invitations: Invitation[]
}

/**
 * Household with guests for dashboard
 */
export type HouseholdWithGuests = {
  id: string
  address1: string | null
  address2: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  phone: string | null
  email: string | null
  notes: string | null
  guests: GuestWithInvitations[]
  gifts: Array<Gift & { event: { name: string } }>
}

/**
 * RSVP response statistics
 */
export type GuestResponses = {
  invited: number
  attending: number
  declined: number
  notInvited: number
}

/**
 * Event with questions and RSVP statistics
 */
export type EventWithStats = {
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
  questions: QuestionWithRecentAnswer[]
  guestResponses: GuestResponses
}

/**
 * Complete dashboard data
 */
export type DashboardData = {
  weddingData: WeddingData
  totalGuests: number
  totalEvents: number
  households: HouseholdWithGuests[]
  events: EventWithStats[]
}
