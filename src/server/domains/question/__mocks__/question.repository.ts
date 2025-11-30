/**
 * Question Repository - Jest Manual Mock
 *
 * This mock is automatically used when jest.mock('~/server/domains/question/question.repository') is called.
 */

import {
  type Answer,
  type Question,
  type QuestionWithOptions,
} from '~/server/domains/question/question.types'

export const mockQuestion: Question = {
  id: 'question-123',
  eventId: 'event-123',
  websiteId: null,
  text: 'What is your meal preference?',
  type: 'Option',
  isRequired: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockWebsiteQuestion: Question = {
  id: 'question-456',
  eventId: null,
  websiteId: 'website-123',
  text: 'Any dietary restrictions?',
  type: 'Text',
  isRequired: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockQuestionWithOptions: QuestionWithOptions = {
  ...mockQuestion,
  options: [
    {
      id: 'option-1',
      questionId: 'question-123',
      text: 'Chicken',
      description: 'Grilled chicken with vegetables',
      responseCount: 5,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'option-2',
      questionId: 'question-123',
      text: 'Fish',
      description: 'Pan-seared salmon',
      responseCount: 3,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  _count: { answers: 8 },
}

export const mockAnswer: Answer = {
  questionId: 'question-123',
  guestId: 1,
  householdId: 'household-123',
  response: 'We will bring 2 children',
  guestFirstName: 'John',
  guestLastName: 'Doe',
  createdAt: new Date('2024-01-02'),
  updatedAt: new Date('2024-01-02'),
}

export const mockFindById = jest.fn()
export const mockFindByIdWithOptions = jest.fn()
export const mockFindByEventId = jest.fn()
export const mockFindByWebsiteId = jest.fn()
export const mockDeleteOptions = jest.fn()
export const mockUpsert = jest.fn()
export const mockDelete = jest.fn()
export const mockExists = jest.fn()
export const mockFindMostRecentAnswerByQuestionId = jest.fn()

export const QuestionRepository = jest.fn().mockImplementation(() => ({
  findById: mockFindById,
  findByIdWithOptions: mockFindByIdWithOptions,
  findByEventId: mockFindByEventId,
  findByWebsiteId: mockFindByWebsiteId,
  deleteOptions: mockDeleteOptions,
  upsert: mockUpsert,
  delete: mockDelete,
  exists: mockExists,
  findMostRecentAnswerByQuestionId: mockFindMostRecentAnswerByQuestionId,
}))

// Helper to reset all mocks
export const resetMocks = (): void => {
  mockFindById.mockReset()
  mockFindByIdWithOptions.mockReset()
  mockFindByEventId.mockReset()
  mockFindByWebsiteId.mockReset()
  mockDeleteOptions.mockReset()
  mockUpsert.mockReset()
  mockDelete.mockReset()
  mockExists.mockReset()
  mockFindMostRecentAnswerByQuestionId.mockReset()
  QuestionRepository.mockClear()
}
