import { TRPCError } from '@trpc/server'

jest.mock('lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))

jest.mock('server/db', () => ({ db: {} }))

jest.mock('~/server/domains/question', () => ({
  questionService: {
    deleteQuestion: jest.fn(),
    upsertQuestion: jest.fn(),
  },
}))

jest.mock('~/server/domains/wedding', () => ({
  weddingService: {
    getScopedWeddingByUserId: jest.fn(),
  },
}))

import { questionService } from '~/server/domains/question'
import { questionRouter } from '~/server/domains/question/question.router'
import { weddingService } from '~/server/domains/wedding'

const mockUpsertQuestion = questionService.upsertQuestion as jest.Mock
const mockDeleteQuestion = questionService.deleteQuestion as jest.Mock
const mockGetScopedWeddingByUserId = weddingService.getScopedWeddingByUserId as jest.Mock

describe('questionRouter authz context plumbing', () => {
  const activeOrganization = {
    organizationId: 'org-123',
    role: 'owner',
  }

  const caller = questionRouter.createCaller({
    auth: {
      session: { user: { id: 'user-123' } },
      activeOrganization,
      userId: 'user-123',
    },
    db: {} as never,
    headers: new Headers(),
  })

  beforeEach(() => {
    jest.resetAllMocks()
    mockGetScopedWeddingByUserId.mockResolvedValue({ id: 'wedding-123', organizationId: 'org-123' })
  })

  it('passes authz context and wedding linkage to upsert service call', async () => {
    mockUpsertQuestion.mockResolvedValue({ id: 'question-1' })

    await caller.upsert({
      eventId: 'event-123',
      isRequired: false,
      text: 'Meal?',
      type: 'Text',
    })

    expect(mockUpsertQuestion).toHaveBeenCalledWith({
      ctx: {
        activeOrganization,
        userId: 'user-123',
      },
      weddingId: 'wedding-123',
      organizationId: 'org-123',
      data: {
        eventId: 'event-123',
        isRequired: false,
        text: 'Meal?',
        type: 'Text',
      },
    })
  })

  it('passes authz context and wedding linkage to delete service call', async () => {
    mockDeleteQuestion.mockResolvedValue({ id: 'question-1' })

    await caller.delete({ questionId: 'question-1' })

    expect(mockDeleteQuestion).toHaveBeenCalledWith({
      ctx: {
        activeOrganization,
        userId: 'user-123',
      },
      weddingId: 'wedding-123',
      organizationId: 'org-123',
      data: {
        questionId: 'question-1',
      },
    })
  })

  it('throws NOT_FOUND when wedding is missing for upsert', async () => {
    mockGetScopedWeddingByUserId.mockRejectedValue(
      new TRPCError({ code: 'NOT_FOUND', message: 'No wedding found' })
    )

    await expect(
      caller.upsert({
        eventId: 'event-123',
        isRequired: false,
        text: 'Meal?',
        type: 'Text',
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })

    expect(mockUpsertQuestion).not.toHaveBeenCalled()
  })

  it('throws NOT_FOUND when wedding is missing for delete', async () => {
    mockGetScopedWeddingByUserId.mockRejectedValue(
      new TRPCError({ code: 'NOT_FOUND', message: 'No wedding found' })
    )

    await expect(caller.delete({ questionId: 'question-1' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })

    expect(mockDeleteQuestion).not.toHaveBeenCalled()
  })
})
