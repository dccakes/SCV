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

import { questionService } from '~/server/domains/question'
import { questionRouter } from '~/server/domains/question/question.router'

const mockUpsertQuestion = questionService.upsertQuestion as jest.Mock
const mockDeleteQuestion = questionService.deleteQuestion as jest.Mock

describe('questionRouter authz context plumbing', () => {
  const activeOrganization = {
    organizationId: 'org-123',
    role: 'owner',
  }

  const caller = questionRouter.createCaller({
    auth: {
      session: { user: { id: 'user-123' } },
      activeOrganization,
      activeWeddingId: 'wedding-123',
      userId: 'user-123',
    },
    db: {} as never,
    headers: new Headers(),
  })

  beforeEach(() => {
    jest.resetAllMocks()
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
        allowOther: false,
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

  it('throws PRECONDITION_FAILED when active wedding is missing for upsert', async () => {
    const callerWithoutWedding = questionRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization,
        activeWeddingId: null,
        userId: 'user-123',
      },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(
      callerWithoutWedding.upsert({
        eventId: 'event-123',
        isRequired: false,
        text: 'Meal?',
        type: 'Text',
      })
    ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' })

    expect(mockUpsertQuestion).not.toHaveBeenCalled()
  })

  it('throws PRECONDITION_FAILED when active wedding is missing for delete', async () => {
    const callerWithoutWedding = questionRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization,
        activeWeddingId: null,
        userId: 'user-123',
      },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(callerWithoutWedding.delete({ questionId: 'question-1' })).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
    })

    expect(mockDeleteQuestion).not.toHaveBeenCalled()
  })

  it('passes through service-level NOT_FOUND errors', async () => {
    mockDeleteQuestion.mockRejectedValue(
      new TRPCError({ code: 'NOT_FOUND', message: 'Question not found' })
    )

    await expect(caller.delete({ questionId: 'question-1' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })

    expect(mockDeleteQuestion).toHaveBeenCalledTimes(1)
  })
})
