/**
 * Question Domain - Barrel Export
 *
 * Exports all question domain components for use throughout the application.
 */

import { QuestionRepository } from '~/server/domains/question/question.repository'
import { QuestionService } from '~/server/domains/question/question.service'
import { db } from '~/server/infrastructure/database'

// Create singleton instances
const questionRepository = new QuestionRepository(db)
export const questionService = new QuestionService(questionRepository)

// Export types
export type {
  Answer,
  DeleteQuestionInput,
  Option,
  OptionInput,
  OptionResponse,
  Question,
  QuestionWithOptions,
  UpsertQuestionInput,
} from '~/server/domains/question/question.types'

// Export validators
export {
  deleteQuestionSchema,
  type DeleteQuestionSchemaInput,
  optionInputSchema,
  type OptionInputSchemaInput,
  questionIdSchema,
  type QuestionIdSchemaInput,
  upsertQuestionSchema,
  type UpsertQuestionSchemaInput,
} from '~/server/domains/question/question.validator'

// Export classes for testing/DI
export { QuestionRepository } from '~/server/domains/question/question.repository'
export { QuestionService } from '~/server/domains/question/question.service'

// Export router
export { questionRouter } from '~/server/domains/question/question.router'
