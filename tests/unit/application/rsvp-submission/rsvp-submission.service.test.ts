/**
 * Tests for RSVP Submission Application Service
 */

import { TRPCError } from '@trpc/server'

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

jest.mock('~/server/domains/invitation/invitation.repository')
jest.mock('~/server/domains/question/question.repository')
jest.mock('~/server/domains/guest/guest.repository')
jest.mock('~/server/domains/household/household.repository')
jest.mock('~/server/domains/wedding/wedding.repository')

import { RsvpSubmissionService } from '~/server/application/rsvp-submission/rsvp-submission.service'
import { requirePermission } from '~/server/authz/permission-checker'
import {
  GuestRepository,
  mockCountByIdsInWedding as mockGuestCountByIdsInWedding,
  resetMocks as resetGuestMocks,
} from '~/server/domains/guest/guest.repository'
import {
  HouseholdRepository,
  mockCountByIdsInWedding as mockHouseholdCountByIdsInWedding,
  resetMocks as resetHouseholdMocks,
} from '~/server/domains/household/household.repository'
import {
  InvitationRepository,
  mockCountByWeddingAndGuestEventPairs,
  mockUpdate,
  resetMocks as resetInvitationMocks,
} from '~/server/domains/invitation/invitation.repository'
import {
  mockAdjustOptionResponseCount,
  mockDeleteAnswer,
  mockDeleteOptionResponse,
  mockFindOptionResponse,
  mockUpsertAnswer,
  mockUpsertOptionResponse,
  QuestionRepository,
  resetMocks as resetQuestionMocks,
} from '~/server/domains/question/question.repository'
import {
  mockFindWeddingIdByValidTokenAndSubUrl,
  resetMocks as resetWeddingMocks,
  WeddingRepository,
} from '~/server/domains/wedding/wedding.repository'

const mockRequirePermission = requirePermission as jest.Mock

const createMockDb = () => ({
  $transaction: jest.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => {
    return fn({ __tx: true })
  }),
  website: {
    findFirst: jest.fn().mockResolvedValue({ weddingId: 'wedding-123', isRsvpEnabled: true }),
  },
})

describe('RsvpSubmissionService', () => {
  let service: RsvpSubmissionService
  let mockDb: ReturnType<typeof createMockDb>

  const actorContext = {
    userId: 'actor-1',
    activeOrganization: {
      organizationId: 'org-1',
      role: 'owner',
    },
  }

  beforeEach(() => {
    resetInvitationMocks()
    resetQuestionMocks()
    resetGuestMocks()
    resetHouseholdMocks()
    resetWeddingMocks()

    mockDb = createMockDb()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-1', role: 'admin' })

    mockCountByWeddingAndGuestEventPairs.mockResolvedValue(1)
    mockGuestCountByIdsInWedding.mockResolvedValue(1)
    mockHouseholdCountByIdsInWedding.mockResolvedValue(1)
    mockFindWeddingIdByValidTokenAndSubUrl.mockResolvedValue('wedding-123')
    mockFindOptionResponse.mockResolvedValue(null)

    const invitationRepo = new InvitationRepository({} as never)
    const questionRepo = new QuestionRepository({} as never)
    const guestRepo = new GuestRepository({} as never)
    const householdRepo = new HouseholdRepository({} as never)
    const weddingRepo = new WeddingRepository({} as never)

    service = new RsvpSubmissionService(
      invitationRepo,
      questionRepo,
      guestRepo,
      householdRepo,
      weddingRepo,
      mockDb as never
    )
  })

  it('requires rsvp edit permission for managed submissions', async () => {
    await service.submitManagedRsvp(actorContext, 'wedding-123', {
      rsvpResponses: [{ eventId: 'event-123', guestId: 1, rsvp: 'Attending' }],
      answersToQuestions: [],
    })

    expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { rsvp: ['edit_response'] })
  })

  it('rejects when rsvp permission is missing', async () => {
    mockRequirePermission.mockImplementation(() => {
      throw new Error('forbidden')
    })

    await expect(
      service.submitManagedRsvp(actorContext, 'wedding-123', {
        rsvpResponses: [],
        answersToQuestions: [],
      })
    ).rejects.toThrow('forbidden')

    expect(mockDb.$transaction).not.toHaveBeenCalled()
  })

  it('updates invitations and question answers via repositories inside transaction', async () => {
    const result = await service.submitRsvp({
      rsvpResponses: [{ eventId: 'event-123', guestId: 1, rsvp: 'Attending' }],
      answersToQuestions: [
        {
          questionId: 'question-text',
          questionType: 'Text',
          response: 'Vegetarian',
          guestId: 1,
          householdId: 'household-123',
        },
        {
          questionId: 'question-option',
          questionType: 'Option',
          response: 'option-456',
          guestId: 1,
          householdId: 'household-123',
        },
      ],
    })

    expect(result).toEqual({ success: true })
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1)
    expect(mockUpdate).toHaveBeenCalledWith(1, 'event-123', {
      rsvp: 'Attending',
      submittedAt: expect.any(Date),
    })
    expect(mockUpsertAnswer).toHaveBeenCalledWith({
      questionId: 'question-text',
      guestId: 1,
      householdId: 'household-123',
      response: 'Vegetarian',
      guestFirstName: undefined,
      guestLastName: undefined,
    })
    expect(mockUpsertOptionResponse).toHaveBeenCalledWith({
      questionId: 'question-option',
      optionId: 'option-456',
      guestId: 1,
      householdId: 'household-123',
      guestFirstName: undefined,
      guestLastName: undefined,
    })
    expect(mockDeleteAnswer).toHaveBeenCalledWith('question-option', 1, 'household-123')
    expect(mockAdjustOptionResponseCount).toHaveBeenCalledWith('option-456', 1)
  })

  it('updates option response and adjusts counts when selection changed', async () => {
    mockFindOptionResponse.mockResolvedValue({
      questionId: 'question-123',
      guestId: 1,
      householdId: 'household-123',
      optionId: 'old-option',
      guestFirstName: null,
      guestLastName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await service.submitRsvp({
      rsvpResponses: [],
      answersToQuestions: [
        {
          questionId: 'question-123',
          questionType: 'Option',
          response: 'new-option',
          guestId: 1,
          householdId: 'household-123',
        },
      ],
    })

    expect(mockUpsertOptionResponse).toHaveBeenCalledWith(
      expect.objectContaining({ optionId: 'new-option' })
    )
    expect(mockAdjustOptionResponseCount).toHaveBeenCalledWith('old-option', -1)
    expect(mockAdjustOptionResponseCount).toHaveBeenCalledWith('new-option', 1)
  })

  it('does not rewrite option response when selection is unchanged', async () => {
    mockFindOptionResponse.mockResolvedValue({
      questionId: 'question-123',
      guestId: 1,
      householdId: 'household-123',
      optionId: 'same-option',
      guestFirstName: null,
      guestLastName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await service.submitRsvp({
      rsvpResponses: [],
      answersToQuestions: [
        {
          questionId: 'question-123',
          questionType: 'Option',
          response: 'same-option',
          guestId: 1,
          householdId: 'household-123',
        },
      ],
    })

    expect(mockUpsertOptionResponse).not.toHaveBeenCalled()
    expect(mockAdjustOptionResponseCount).not.toHaveBeenCalled()
  })

  it('uses default identifiers for null guest/household IDs', async () => {
    await service.submitRsvp({
      rsvpResponses: [],
      answersToQuestions: [
        {
          questionId: 'question-123',
          questionType: 'Option',
          response: 'option-456',
          guestId: null,
          householdId: null,
        },
      ],
    })

    expect(mockFindOptionResponse).toHaveBeenCalledWith('question-123', -1, '-1')
    expect(mockUpsertOptionResponse).toHaveBeenCalledWith(
      expect.objectContaining({ guestId: -1, householdId: '-1' })
    )
  })

  it('clears prior option response when saving a text answer for an option question', async () => {
    mockFindOptionResponse.mockResolvedValue({
      optionId: 'option-123',
    })

    await service.submitRsvp({
      rsvpResponses: [],
      answersToQuestions: [
        {
          questionId: 'question-123',
          questionType: 'Text',
          response: 'Other: pescatarian',
          guestId: 1,
          householdId: 'household-123',
        },
      ],
    })

    expect(mockDeleteOptionResponse).toHaveBeenCalledWith('question-123', 1, 'household-123')
    expect(mockAdjustOptionResponseCount).toHaveBeenCalledWith('option-123', -1)
    expect(mockUpsertAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        questionId: 'question-123',
        response: 'Other: pescatarian',
      })
    )
  })

  it('resolves the wedding from the subUrl and submits (no token needed)', async () => {
    const result = await service.submitPublicRsvp({
      subUrl: 'ash-and-jamie',
      rsvpResponses: [{ eventId: 'event-123', guestId: 1, rsvp: 'Attending' }],
      answersToQuestions: [],
    })

    expect(result).toEqual({ success: true })
    expect(mockDb.website.findFirst).toHaveBeenCalledWith({
      where: { subUrl: 'ash-and-jamie' },
      select: { weddingId: true, isRsvpEnabled: true },
    })
    // subUrl resolution succeeded, so the token path is not used.
    expect(mockFindWeddingIdByValidTokenAndSubUrl).not.toHaveBeenCalled()
  })

  it('falls back to a valid token when the site has RSVP disabled', async () => {
    mockDb.website.findFirst.mockResolvedValue({ weddingId: 'wedding-123', isRsvpEnabled: false })

    const result = await service.submitPublicRsvp({
      subUrl: 'ash-and-jamie',
      token: 'a'.repeat(32),
      rsvpResponses: [{ eventId: 'event-123', guestId: 1, rsvp: 'Attending' }],
      answersToQuestions: [],
    })

    expect(result).toEqual({ success: true })
    expect(mockFindWeddingIdByValidTokenAndSubUrl).toHaveBeenCalledWith(
      'ash-and-jamie',
      'a'.repeat(32)
    )
  })

  it('rejects when the site is unknown or RSVP is disabled and no token is supplied', async () => {
    mockDb.website.findFirst.mockResolvedValue(null)

    await expect(
      service.submitPublicRsvp({
        subUrl: 'ash-and-jamie',
        rsvpResponses: [],
        answersToQuestions: [],
      })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'RSVP is not available for this wedding',
    })
  })

  it('rejects a fallback token that is invalid or expired', async () => {
    mockDb.website.findFirst.mockResolvedValue({ weddingId: 'wedding-123', isRsvpEnabled: false })
    mockFindWeddingIdByValidTokenAndSubUrl.mockResolvedValue(null)

    await expect(
      service.submitPublicRsvp({
        subUrl: 'ash-and-jamie',
        token: 'a'.repeat(32),
        rsvpResponses: [],
        answersToQuestions: [],
      })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'Invalid or expired RSVP token',
    })
  })

  it('rejects when submission scope does not belong to wedding', async () => {
    mockCountByWeddingAndGuestEventPairs.mockResolvedValue(0)

    await expect(
      service.submitManagedRsvp(actorContext, 'wedding-123', {
        rsvpResponses: [{ eventId: 'event-123', guestId: 1, rsvp: 'Attending' }],
        answersToQuestions: [],
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    expect(mockDb.$transaction).not.toHaveBeenCalled()
  })

  it('rejects when guest or household ids are outside wedding scope', async () => {
    mockCountByWeddingAndGuestEventPairs.mockResolvedValue(1)
    mockGuestCountByIdsInWedding.mockResolvedValue(0)

    await expect(
      service.submitManagedRsvp(actorContext, 'wedding-123', {
        rsvpResponses: [{ eventId: 'event-123', guestId: 1, rsvp: 'Attending' }],
        answersToQuestions: [
          { questionId: 'q', questionType: 'Text', response: 'x', householdId: 'h-1' },
        ],
      })
    ).rejects.toBeInstanceOf(TRPCError)
  })
})
