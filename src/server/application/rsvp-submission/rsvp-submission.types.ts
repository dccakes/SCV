/**
 * RSVP Submission Application Service - Types
 *
 * Types for the guest-facing RSVP submission flow.
 */

/**
 * RSVP response for a single guest/event combination
 */
export type RsvpResponse = {
  guestId: number
  eventId: string
  rsvp: string
}

/**
 * Answer to a question (either text or option)
 */
export type AnswerToQuestion = {
  questionId: string
  questionType: 'Text' | 'Option'
  response: string
  guestId?: number
  guestFirstName?: string
  guestLastName?: string
  householdId?: string
}

/**
 * Complete RSVP form submission data
 */
export type RsvpSubmissionInput = {
  rsvpResponses: RsvpResponse[]
  answersToQuestions: AnswerToQuestion[]
  guestDietaryResponses?: Array<{
    guestId: number
    dietaryRestrictions: {
      selections: string[]
      notes: string
    }
  }>
}

/**
 * Result of RSVP submission
 */
export type RsvpSubmissionResult = {
  success: boolean
}
