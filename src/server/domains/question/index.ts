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

// Export classes for testing/DI
export { QuestionRepository } from '~/server/domains/question/question.repository'
// Export router
export { questionRouter } from '~/server/domains/question/question.router'
export { QuestionService } from '~/server/domains/question/question.service'
// Export types
export type {
  Answer,
  DeleteQuestionInput,
  HouseholdAnswerGroup,
  HouseholdAnswerResponse,
  Option,
  OptionInput,
  OptionResponse,
  Question,
  QuestionWithOptions,
  UpsertQuestionInput,
  WebsiteQuestions,
} from '~/server/domains/question/question.types'
// Export validators
export {
  type DeleteQuestionSchemaInput,
  deleteQuestionSchema,
  type OptionInputSchemaInput,
  optionInputSchema,
  type QuestionIdSchemaInput,
  questionIdSchema,
  type UpsertQuestionSchemaInput,
  upsertQuestionSchema,
} from '~/server/domains/question/question.validator'
