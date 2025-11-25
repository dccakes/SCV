/**
 * Question Type Constants
 *
 * Defines the possible question types for RSVP forms.
 */

export const QUESTION_TYPE = {
  TEXT: 'Text',
  OPTION: 'Option',
} as const

export type QuestionType = (typeof QUESTION_TYPE)[keyof typeof QUESTION_TYPE]

/**
 * Array of all question types for iteration/validation
 */
export const QUESTION_TYPE_VALUES = Object.values(QUESTION_TYPE)
