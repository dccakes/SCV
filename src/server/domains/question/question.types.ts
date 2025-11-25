/**
 * Question Domain - Types
 *
 * Type definitions for the Question domain entity.
 * Questions are used for RSVP forms on both Events and the Website.
 */

/**
 * Core Question entity type
 */
export type Question = {
  id: string
  eventId: string | null
  websiteId: string | null
  text: string
  type: string // 'Text' | 'Option'
  isRequired: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Option entity (for multiple choice questions)
 */
export type Option = {
  id: string
  questionId: string
  text: string
  description: string
  responseCount: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Answer entity (text responses)
 */
export type Answer = {
  response: string
  questionId: string
  guestId: number
  householdId: string
  guestFirstName: string | null
  guestLastName: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * OptionResponse entity (multiple choice responses)
 */
export type OptionResponse = {
  questionId: string
  optionId: string
  guestId: number
  householdId: string
  guestFirstName: string | null
  guestLastName: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Question with options included
 */
export type QuestionWithOptions = Question & {
  options: Option[]
  _count?: {
    answers: number
  }
}

/**
 * Input for creating/updating an option
 */
export type OptionInput = {
  id?: string
  questionId?: string
  responseCount?: number
  text: string
  description?: string
}

/**
 * Input for upserting a question (create or update)
 */
export type UpsertQuestionInput = {
  questionId?: string
  websiteId?: string | null
  eventId?: string | null
  text: string
  type: string
  isRequired: boolean
  options?: OptionInput[]
  deletedOptions?: string[]
}

/**
 * Input for deleting a question
 */
export type DeleteQuestionInput = {
  questionId: string
}
