/**
 * Tests for Question Domain Service
 */

import { TRPCError } from '@trpc/server'

// Must mock before importing the service
jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

jest.mock('~/server/domains/question/question.repository')

import { requirePermission } from '~/server/authz/permission-checker'
// @ts-expect-error - Importing mock functions from mocked module
import {
  mockBelongsToWedding,
  mockDelete,
  mockDeleteOptionsForQuestion,
  mockEventBelongsToWedding,
  mockFindByEventId,
  mockFindById,
  mockFindByIdWithOptions,
  mockFindByWebsiteId,
  mockQuestion,
  mockQuestionWithOptions,
  mockUpsert,
  mockWebsiteBelongsToWedding,
  mockWebsiteQuestion,
  QuestionRepository,
  resetMocks,
} from '~/server/domains/question/question.repository'
import { QuestionService } from '~/server/domains/question/question.service'

// Create typed aliases for mocked functions
const mockUpsertFn = mockUpsert as jest.Mock
const mockDeleteFn = mockDelete as jest.Mock
const mockDeleteOptionsForQuestionFn = mockDeleteOptionsForQuestion as jest.Mock
const mockFindByIdFn = mockFindById as jest.Mock
const mockFindByIdWithOptionsFn = mockFindByIdWithOptions as jest.Mock
const mockFindByEventIdFn = mockFindByEventId as jest.Mock
const mockFindByWebsiteIdFn = mockFindByWebsiteId as jest.Mock
const mockBelongsToWeddingFn = mockBelongsToWedding as jest.Mock
const mockEventBelongsToWeddingFn = mockEventBelongsToWedding as jest.Mock
const mockWebsiteBelongsToWeddingFn = mockWebsiteBelongsToWedding as jest.Mock
const mockRequirePermission = requirePermission as jest.Mock

describe('QuestionService', () => {
  let questionService: QuestionService
  const actorContext = {
    userId: 'actor-1',
    activeOrganization: null,
  }

  beforeEach(() => {
    resetMocks()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-1', role: 'admin' })
    mockBelongsToWeddingFn.mockResolvedValue(true)
    mockEventBelongsToWeddingFn.mockResolvedValue(true)
    mockWebsiteBelongsToWeddingFn.mockResolvedValue(true)
    const mockRepository = new QuestionRepository({})
    questionService = new QuestionService(mockRepository)
  })

  describe('upsertQuestion', () => {
    it('should create an event question successfully', async () => {
      mockUpsertFn.mockResolvedValue(mockQuestion)

      const result = await questionService.upsertQuestion({
        ctx: actorContext,
        weddingId: 'wedding-123',
        organizationId: 'org-1',
        data: {
          eventId: 'event-123',
          text: 'What is your meal preference?',
          type: 'Option',
          isRequired: true,
          options: [
            { text: 'Chicken', description: 'Grilled' },
            { text: 'Fish', description: 'Pan-seared' },
          ],
        },
      })

      expect(result).toEqual(mockQuestion)
      expect(mockUpsertFn).toHaveBeenCalled()
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { event: ['update'] })
    })

    it('should create a website question successfully', async () => {
      mockUpsertFn.mockResolvedValue(mockWebsiteQuestion)

      const result = await questionService.upsertQuestion({
        ctx: actorContext,
        weddingId: 'wedding-123',
        organizationId: 'org-1',
        data: {
          websiteId: 'website-123',
          text: 'Any dietary restrictions?',
          type: 'Text',
          isRequired: false,
        },
      })

      expect(result).toEqual(mockWebsiteQuestion)
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { website: ['update'] })
    })

    it('should reject upsert when permission check fails', async () => {
      mockRequirePermission.mockImplementation(() => {
        throw new TRPCError({ code: 'FORBIDDEN' })
      })

      await expect(
        questionService.upsertQuestion({
          ctx: actorContext,
          weddingId: 'wedding-123',
          organizationId: 'org-1',
          data: {
            eventId: 'event-123',
            text: 'Denied question',
            type: 'Text',
            isRequired: false,
          },
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })

      expect(mockUpsertFn).not.toHaveBeenCalled()
    })

    it('should throw error when neither eventId nor websiteId provided', async () => {
      await expect(
        questionService.upsertQuestion({
          ctx: actorContext,
          weddingId: 'wedding-123',
          organizationId: 'org-1',
          data: {
            text: 'Invalid question',
            type: 'Text',
            isRequired: false,
          },
        })
      ).rejects.toThrow(TRPCError)

      await expect(
        questionService.upsertQuestion({
          ctx: actorContext,
          weddingId: 'wedding-123',
          organizationId: 'org-1',
          data: {
            text: 'Invalid question',
            type: 'Text',
            isRequired: false,
          },
        })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Question must belong to either Event or Website',
      })
    })

    it('should throw error when both eventId and websiteId provided', async () => {
      await expect(
        questionService.upsertQuestion({
          ctx: actorContext,
          weddingId: 'wedding-123',
          organizationId: 'org-1',
          data: {
            eventId: 'event-123',
            websiteId: 'website-123',
            text: 'Invalid question',
            type: 'Text',
            isRequired: false,
          },
        })
      ).rejects.toThrow(TRPCError)

      await expect(
        questionService.upsertQuestion({
          ctx: actorContext,
          weddingId: 'wedding-123',
          organizationId: 'org-1',
          data: {
            eventId: 'event-123',
            websiteId: 'website-123',
            text: 'Invalid question',
            type: 'Text',
            isRequired: false,
          },
        })
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Question cannot belong to both Event and Website',
      })
    })

    it('should delete options before upserting when deletedOptions provided', async () => {
      mockDeleteOptionsForQuestionFn.mockResolvedValue({ count: 2 })
      mockFindByIdFn.mockResolvedValue(mockQuestion)
      mockUpsertFn.mockResolvedValue(mockQuestion)

      await questionService.upsertQuestion({
        ctx: actorContext,
        weddingId: 'wedding-123',
        organizationId: 'org-1',
        data: {
          questionId: 'question-123',
          eventId: 'event-123',
          text: 'Updated question',
          type: 'Option',
          isRequired: true,
          options: [{ text: 'New Option A' }, { text: 'New Option B' }],
          deletedOptions: ['option-1', 'option-2'],
        },
      })

      expect(mockDeleteOptionsForQuestionFn).toHaveBeenCalledWith('question-123', [
        'option-1',
        'option-2',
      ])
      expect(mockUpsertFn).toHaveBeenCalled()
    })

    it('should reject deleted options when questionId is missing', async () => {
      await expect(
        questionService.upsertQuestion({
          ctx: actorContext,
          weddingId: 'wedding-123',
          organizationId: 'org-1',
          data: {
            eventId: 'event-123',
            text: 'Updated question',
            type: 'Option',
            isRequired: true,
            options: [{ text: 'A' }, { text: 'B' }],
            deletedOptions: ['option-1'],
          },
        })
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' })

      expect(mockDeleteOptionsForQuestionFn).not.toHaveBeenCalled()
      expect(mockUpsertFn).not.toHaveBeenCalled()
    })

    it('should reject updates without organization link', async () => {
      await expect(
        questionService.upsertQuestion({
          ctx: actorContext,
          weddingId: 'wedding-123',
          organizationId: null,
          data: {
            eventId: 'event-123',
            text: 'Q',
            type: 'Text',
            isRequired: false,
          },
        })
      ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' })
    })

    it('should reject upsert when event is outside wedding scope', async () => {
      mockEventBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        questionService.upsertQuestion({
          ctx: actorContext,
          weddingId: 'wedding-123',
          organizationId: 'org-1',
          data: {
            eventId: 'event-out',
            text: 'Q',
            type: 'Text',
            isRequired: false,
          },
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })

      expect(mockUpsertFn).not.toHaveBeenCalled()
    })

    it('should reject upsert when website is outside wedding scope', async () => {
      mockWebsiteBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        questionService.upsertQuestion({
          ctx: actorContext,
          weddingId: 'wedding-123',
          organizationId: 'org-1',
          data: {
            websiteId: 'website-out',
            text: 'Website Q',
            type: 'Text',
            isRequired: false,
          },
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })

      expect(mockUpsertFn).not.toHaveBeenCalled()
    })

    it('should reject update when scope input mismatches existing website question', async () => {
      mockFindByIdFn.mockResolvedValue(mockWebsiteQuestion)

      await expect(
        questionService.upsertQuestion({
          ctx: actorContext,
          weddingId: 'wedding-123',
          organizationId: 'org-1',
          data: {
            questionId: 'question-website-123',
            eventId: 'event-123',
            text: 'Invalid scope update',
            type: 'Text',
            isRequired: false,
          },
        })
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' })

      expect(mockUpsertFn).not.toHaveBeenCalled()
    })

    it('should reject update when question is outside wedding scope', async () => {
      mockFindByIdFn.mockResolvedValue(mockQuestion)
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        questionService.upsertQuestion({
          ctx: actorContext,
          weddingId: 'wedding-123',
          organizationId: 'org-1',
          data: {
            questionId: 'question-out',
            eventId: 'event-123',
            text: 'Out of scope',
            type: 'Text',
            isRequired: false,
          },
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })

      expect(mockUpsertFn).not.toHaveBeenCalled()
    })
  })

  describe('deleteQuestion', () => {
    it('should delete a question', async () => {
      mockDeleteFn.mockResolvedValue(mockQuestion)

      mockFindByIdFn.mockResolvedValue(mockQuestion)

      const result = await questionService.deleteQuestion({
        ctx: actorContext,
        weddingId: 'wedding-123',
        organizationId: 'org-1',
        data: { questionId: 'question-123' },
      })

      expect(result).toEqual(mockQuestion)
      expect(mockDeleteFn).toHaveBeenCalledWith('question-123')
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { event: ['update'] })
    })

    it('should reject delete when question is outside wedding scope', async () => {
      mockFindByIdFn.mockResolvedValue(mockQuestion)
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        questionService.deleteQuestion({
          ctx: actorContext,
          weddingId: 'wedding-123',
          organizationId: 'org-1',
          data: { questionId: 'question-123' },
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })

      expect(mockDeleteFn).not.toHaveBeenCalled()
    })

    it('should return FORBIDDEN when deleting missing question', async () => {
      mockFindByIdFn.mockResolvedValue(null)

      await expect(
        questionService.deleteQuestion({
          ctx: actorContext,
          weddingId: 'wedding-123',
          organizationId: 'org-1',
          data: { questionId: 'missing-question' },
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('should reject delete when permission check fails', async () => {
      mockFindByIdFn.mockResolvedValue(mockQuestion)
      mockRequirePermission.mockImplementation(() => {
        throw new TRPCError({ code: 'FORBIDDEN' })
      })

      await expect(
        questionService.deleteQuestion({
          ctx: actorContext,
          weddingId: 'wedding-123',
          organizationId: 'org-1',
          data: { questionId: 'question-123' },
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })

      expect(mockDeleteFn).not.toHaveBeenCalled()
    })

    it('should reject delete without organization link', async () => {
      await expect(
        questionService.deleteQuestion({
          ctx: actorContext,
          weddingId: 'wedding-123',
          organizationId: null,
          data: { questionId: 'question-123' },
        })
      ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' })
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
      const websiteQuestionWithOptions = {
        ...mockWebsiteQuestion,
        options: [],
        _count: { answers: 0 },
      }
      mockFindByWebsiteIdFn.mockResolvedValue([websiteQuestionWithOptions])

      const result = await questionService.getByWebsiteId('website-123')

      expect(result).toEqual([websiteQuestionWithOptions])
      expect(mockFindByWebsiteIdFn).toHaveBeenCalledWith('website-123')
    })
  })
})
