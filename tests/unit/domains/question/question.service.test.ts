/**
 * Tests for Question Domain Service
 */

import { TRPCError } from '@trpc/server'

// Must mock before importing the service
jest.mock('~/server/domains/question/question.repository')

// @ts-expect-error - Importing mock functions from mocked module
import {
  mockDelete,
  mockDeleteOptions,
  mockFindByEventId,
  mockFindById,
  mockFindByIdWithOptions,
  mockFindByWebsiteId,
  mockQuestion,
  mockQuestionWithOptions,
  mockUpsert,
  mockWebsiteQuestion,
  QuestionRepository,
  resetMocks,
} from '~/server/domains/question/question.repository'
import { QuestionService } from '~/server/domains/question/question.service'

// Create typed aliases for mocked functions
const mockUpsertFn = mockUpsert as jest.Mock
const mockDeleteFn = mockDelete as jest.Mock
const mockDeleteOptionsFn = mockDeleteOptions as jest.Mock
const mockFindByIdFn = mockFindById as jest.Mock
const mockFindByIdWithOptionsFn = mockFindByIdWithOptions as jest.Mock
const mockFindByEventIdFn = mockFindByEventId as jest.Mock
const mockFindByWebsiteIdFn = mockFindByWebsiteId as jest.Mock

describe('QuestionService', () => {
  let questionService: QuestionService

  beforeEach(() => {
    resetMocks()
    const mockRepository = new QuestionRepository({})
    questionService = new QuestionService(mockRepository)
  })

  describe('upsertQuestion', () => {
    it('should create an event question successfully', async () => {
      mockUpsertFn.mockResolvedValue(mockQuestion)

      const result = await questionService.upsertQuestion({
        eventId: 'event-123',
        text: 'What is your meal preference?',
        type: 'Option',
        isRequired: true,
        options: [
          { text: 'Chicken', description: 'Grilled' },
          { text: 'Fish', description: 'Pan-seared' },
        ],
      })

      expect(result).toEqual(mockQuestion)
      expect(mockUpsertFn).toHaveBeenCalled()
    })

    it('should create a website question successfully', async () => {
      mockUpsertFn.mockResolvedValue(mockWebsiteQuestion)

      const result = await questionService.upsertQuestion({
        websiteId: 'website-123',
        text: 'Any dietary restrictions?',
        type: 'Text',
        isRequired: false,
      })

      expect(result).toEqual(mockWebsiteQuestion)
    })

    it('should throw error when neither eventId nor websiteId provided', async () => {
      await expect(
        questionService.upsertQuestion({
          text: 'Invalid question',
          type: 'Text',
          isRequired: false,
        })
      ).rejects.toThrow(TRPCError)

      await expect(
        questionService.upsertQuestion({
          text: 'Invalid question',
          type: 'Text',
          isRequired: false,
        })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Question must belong to either Event or Website',
      })
    })

    it('should throw error when both eventId and websiteId provided', async () => {
      await expect(
        questionService.upsertQuestion({
          eventId: 'event-123',
          websiteId: 'website-123',
          text: 'Invalid question',
          type: 'Text',
          isRequired: false,
        })
      ).rejects.toThrow(TRPCError)

      await expect(
        questionService.upsertQuestion({
          eventId: 'event-123',
          websiteId: 'website-123',
          text: 'Invalid question',
          type: 'Text',
          isRequired: false,
        })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Question cannot belong to both Event and Website',
      })
    })

    it('should delete options before upserting when deletedOptions provided', async () => {
      mockDeleteOptionsFn.mockResolvedValue({ count: 2 })
      mockUpsertFn.mockResolvedValue(mockQuestion)

      await questionService.upsertQuestion({
        questionId: 'question-123',
        eventId: 'event-123',
        text: 'Updated question',
        type: 'Option',
        isRequired: true,
        options: [
          { text: 'New Option A' },
          { text: 'New Option B' },
        ],
        deletedOptions: ['option-1', 'option-2'],
      })

      expect(mockDeleteOptionsFn).toHaveBeenCalledWith(['option-1', 'option-2'])
      expect(mockUpsertFn).toHaveBeenCalled()
    })
  })

  describe('deleteQuestion', () => {
    it('should delete a question', async () => {
      mockDeleteFn.mockResolvedValue(mockQuestion)

      const result = await questionService.deleteQuestion({ questionId: 'question-123' })

      expect(result).toEqual(mockQuestion)
      expect(mockDeleteFn).toHaveBeenCalledWith('question-123')
    })
  })

  describe('getById', () => {
    it('should return a question when found', async () => {
      mockFindByIdFn.mockResolvedValue(mockQuestion)

      const result = await questionService.getById('question-123')

      expect(result).toEqual(mockQuestion)
      expect(mockFindByIdFn).toHaveBeenCalledWith('question-123')
    })

    it('should return null when question not found', async () => {
      mockFindByIdFn.mockResolvedValue(null)

      const result = await questionService.getById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('getByIdWithOptions', () => {
    it('should return question with options', async () => {
      mockFindByIdWithOptionsFn.mockResolvedValue(mockQuestionWithOptions)

      const result = await questionService.getByIdWithOptions('question-123')

      expect(result).toEqual(mockQuestionWithOptions)
      expect(result?.options).toHaveLength(2)
    })
  })

  describe('getByEventId', () => {
    it('should return all questions for an event', async () => {
      mockFindByEventIdFn.mockResolvedValue([mockQuestionWithOptions])

      const result = await questionService.getByEventId('event-123')

      expect(result).toEqual([mockQuestionWithOptions])
      expect(mockFindByEventIdFn).toHaveBeenCalledWith('event-123')
    })
  })

  describe('getByWebsiteId', () => {
    it('should return all questions for a website', async () => {
      const websiteQuestionWithOptions = { ...mockWebsiteQuestion, options: [], _count: { answers: 0 } }
      mockFindByWebsiteIdFn.mockResolvedValue([websiteQuestionWithOptions])

      const result = await questionService.getByWebsiteId('website-123')

      expect(result).toEqual([websiteQuestionWithOptions])
      expect(mockFindByWebsiteIdFn).toHaveBeenCalledWith('website-123')
    })
  })
})
