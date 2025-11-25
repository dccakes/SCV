/**
 * Question Domain - Repository Mock
 *
 * Jest mock for the QuestionRepository class.
 * Used for unit testing the QuestionService.
 */

import {
  type OptionInput,
  type Question,
  type QuestionWithOptions,
} from '~/server/domains/question/question.types'

export const mockQuestionRepository = {
  findById: jest.fn<Promise<Question | null>, [string]>(),
  findByIdWithOptions: jest.fn<Promise<QuestionWithOptions | null>, [string]>(),
  findByEventId: jest.fn<Promise<QuestionWithOptions[]>, [string]>(),
  findByWebsiteId: jest.fn<Promise<QuestionWithOptions[]>, [string]>(),
  deleteOptions: jest.fn<Promise<{ count: number }>, [string[]]>(),
  upsert: jest.fn<Promise<Question>, [{ questionId?: string; eventId?: string | null; websiteId?: string | null; text: string; type: string; isRequired: boolean; options?: OptionInput[] }]>(),
  delete: jest.fn<Promise<Question>, [string]>(),
  exists: jest.fn<Promise<boolean>, [string]>(),
}

export const QuestionRepository = jest.fn().mockImplementation(() => mockQuestionRepository)
