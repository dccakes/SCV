/**
 * Tests for RSVP Submission Application Service
 *
 * This service handles guest-facing RSVP form submissions.
 * Tests verify correct transactional behavior and domain coordination.
 */

import { RsvpSubmissionService } from '~/server/application/rsvp-submission/rsvp-submission.service'

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

import { requirePermission } from '~/server/authz/permission-checker'

// Mock data
const mockInvitation = {
  guestId: 1,
  eventId: 'event-123',
  rsvp: 'Attending',
  invitedAt: null,
  updatedAt: new Date(),
  userId: 'user-123',
}

const mockOptionResponse = {
  questionId: 'question-123',
  optionId: 'option-456',
  guestId: 1,
  guestFirstName: 'John',
  guestLastName: 'Doe',
  householdId: 'household-123',
}

const mockOption = {
  id: 'option-456',
  questionId: 'question-123',
  text: 'Option A',
  description: null,
  responseCount: 5,
}

const mockAnswer = {
  id: 'answer-123',
  questionId: 'question-123',
  guestId: 1,
  guestFirstName: 'John',
  guestLastName: 'Doe',
  householdId: 'household-123',
  response: 'My text answer',
  createdAt: new Date(),
}

// Create mock transaction client
const createMockTransactionClient = () => ({
  invitation: {
    update: jest.fn().mockResolvedValue(mockInvitation),
  },
  optionResponse: {
    findFirst: jest.fn(),
    create: jest.fn().mockResolvedValue(mockOptionResponse),
    update: jest.fn().mockResolvedValue(mockOptionResponse),
  },
  option: {
    update: jest.fn().mockResolvedValue(mockOption),
  },
  answer: {
    upsert: jest.fn().mockResolvedValue(mockAnswer),
  },
})

// Create mock Prisma client with transaction support
const createMockDb = () => {
  const mockTransactionClient = createMockTransactionClient()

  return {
    wedding: {
      findFirst: jest.fn(),
    },
    invitation: {
      count: jest.fn(),
    },
    guest: {
      count: jest.fn(),
    },
    household: {
      count: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback(mockTransactionClient)
    }),
    _mockTransactionClient: mockTransactionClient,
  }
}

describe('RsvpSubmissionService', () => {
  let service: RsvpSubmissionService
  let mockDb: ReturnType<typeof createMockDb>
  const mockRequirePermission = requirePermission as jest.Mock
  const actorContext = {
    headers: new Headers(),
    userId: 'actor-1',
    sessionActiveOrganizationId: 'org-1',
  }

  beforeEach(() => {
    mockDb = createMockDb()
    service = new RsvpSubmissionService(mockDb as never)
    mockRequirePermission.mockReset()
    mockRequirePermission.mockResolvedValue({ organizationId: 'org-1', role: 'admin' })
  })

  describe('submitManagedRsvp', () => {
    it('requires rsvp edit permission before processing', async () => {
      mockDb.invitation.count.mockResolvedValue(1)
      mockDb.guest.count.mockResolvedValue(1)
      mockDb.household.count.mockResolvedValue(1)

      await service.submitManagedRsvp(actorContext, 'wedding-123', {
        rsvpResponses: [{ eventId: 'event-123', guestId: 1, rsvp: 'Attending' }],
        answersToQuestions: [
          {
            questionId: 'question-123',
            questionType: 'Text',
            response: 'text',
            guestId: 1,
            householdId: 'household-123',
          },
        ],
      })

      expect(mockRequirePermission).toHaveBeenCalledWith(
        actorContext,
        { rsvp: ['edit_response'] },
        { organizationId: 'org-1' }
      )
    })

    it('rejects when rsvp permission is missing', async () => {
      mockRequirePermission.mockRejectedValue(new Error('forbidden'))

      await expect(
        service.submitManagedRsvp(actorContext, 'wedding-123', {
          rsvpResponses: [],
          answersToQuestions: [],
        })
      ).rejects.toThrow('forbidden')

      expect(mockDb.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('submitRsvp', () => {
    it('should update RSVP statuses for all invitations', async () => {
      const result = await service.submitRsvp({
        rsvpResponses: [
          { eventId: 'event-123', guestId: 1, rsvp: 'Attending' },
          { eventId: 'event-456', guestId: 1, rsvp: 'Declined' },
        ],
        answersToQuestions: [],
      })

      expect(result).toEqual({ success: true })
      expect(mockDb.$transaction).toHaveBeenCalledTimes(1)

      const txClient = mockDb._mockTransactionClient
      expect(txClient.invitation.update).toHaveBeenCalledTimes(2)
      expect(txClient.invitation.update).toHaveBeenCalledWith({
        where: { guestId_eventId: { guestId: 1, eventId: 'event-123' } },
        data: { rsvp: 'Attending' },
      })
      expect(txClient.invitation.update).toHaveBeenCalledWith({
        where: { guestId_eventId: { guestId: 1, eventId: 'event-456' } },
        data: { rsvp: 'Declined' },
      })
    })

    it('should process text question answers with upsert', async () => {
      const result = await service.submitRsvp({
        rsvpResponses: [],
        answersToQuestions: [
          {
            questionId: 'question-123',
            questionType: 'Text',
            response: 'Vegetarian please',
            guestId: 1,
            householdId: 'household-123',
            guestFirstName: 'John',
            guestLastName: 'Doe',
          },
        ],
      })

      expect(result).toEqual({ success: true })

      const txClient = mockDb._mockTransactionClient
      expect(txClient.answer.upsert).toHaveBeenCalledWith({
        where: {
          answerId: {
            questionId: 'question-123',
            guestId: 1,
            householdId: 'household-123',
          },
        },
        update: { response: 'Vegetarian please' },
        create: {
          response: 'Vegetarian please',
          questionId: 'question-123',
          guestId: 1,
          guestFirstName: 'John',
          guestLastName: 'Doe',
          householdId: 'household-123',
        },
      })
    })

    it('should create new option response when none exists', async () => {
      const txClient = mockDb._mockTransactionClient
      txClient.optionResponse.findFirst.mockResolvedValue(null)

      await service.submitRsvp({
        rsvpResponses: [],
        answersToQuestions: [
          {
            questionId: 'question-123',
            questionType: 'Option',
            response: 'option-456',
            guestId: 1,
            householdId: 'household-123',
            guestFirstName: 'John',
            guestLastName: 'Doe',
          },
        ],
      })

      expect(txClient.optionResponse.create).toHaveBeenCalledWith({
        data: {
          questionId: 'question-123',
          optionId: 'option-456',
          guestId: 1,
          guestFirstName: 'John',
          guestLastName: 'Doe',
          householdId: 'household-123',
        },
      })
      expect(txClient.option.update).toHaveBeenCalledWith({
        where: { id: 'option-456' },
        data: { responseCount: { increment: 1 } },
      })
    })

    it('should update option response and adjust counts when selection changes', async () => {
      const txClient = mockDb._mockTransactionClient
      txClient.optionResponse.findFirst.mockResolvedValue({
        ...mockOptionResponse,
        optionId: 'old-option-789', // Different from new selection
      })

      await service.submitRsvp({
        rsvpResponses: [],
        answersToQuestions: [
          {
            questionId: 'question-123',
            questionType: 'Option',
            response: 'new-option-456',
            guestId: 1,
            householdId: 'household-123',
          },
        ],
      })

      // Should update the option response
      expect(txClient.optionResponse.update).toHaveBeenCalledWith({
        where: {
          optionResponseId: {
            questionId: 'question-123',
            guestId: 1,
            householdId: 'household-123',
          },
        },
        data: { optionId: 'new-option-456' },
      })

      // Should decrement old option count
      expect(txClient.option.update).toHaveBeenCalledWith({
        where: { id: 'old-option-789' },
        data: { responseCount: { decrement: 1 } },
      })

      // Should increment new option count
      expect(txClient.option.update).toHaveBeenCalledWith({
        where: { id: 'new-option-456' },
        data: { responseCount: { increment: 1 } },
      })
    })

    it('should not update when option selection is unchanged', async () => {
      const txClient = mockDb._mockTransactionClient
      txClient.optionResponse.findFirst.mockResolvedValue({
        ...mockOptionResponse,
        optionId: 'same-option-456', // Same as new selection
      })

      await service.submitRsvp({
        rsvpResponses: [],
        answersToQuestions: [
          {
            questionId: 'question-123',
            questionType: 'Option',
            response: 'same-option-456',
            guestId: 1,
            householdId: 'household-123',
          },
        ],
      })

      // Should NOT update or create anything
      expect(txClient.optionResponse.create).not.toHaveBeenCalled()
      expect(txClient.optionResponse.update).not.toHaveBeenCalled()
      expect(txClient.option.update).not.toHaveBeenCalled()
    })

    it('should handle default values for null guestId and householdId', async () => {
      const txClient = mockDb._mockTransactionClient
      txClient.optionResponse.findFirst.mockResolvedValue(null)

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

      expect(txClient.optionResponse.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          guestId: -1,
          householdId: '-1',
        }),
      })
    })

    it('should process mixed RSVP responses and question answers', async () => {
      const txClient = mockDb._mockTransactionClient
      txClient.optionResponse.findFirst.mockResolvedValue(null)

      const result = await service.submitRsvp({
        rsvpResponses: [{ eventId: 'event-123', guestId: 1, rsvp: 'Attending' }],
        answersToQuestions: [
          {
            questionId: 'question-text',
            questionType: 'Text',
            response: 'My answer',
            guestId: 1,
            householdId: 'household-123',
          },
          {
            questionId: 'question-option',
            questionType: 'Option',
            response: 'option-789',
            guestId: 1,
            householdId: 'household-123',
          },
        ],
      })

      expect(result).toEqual({ success: true })
      expect(txClient.invitation.update).toHaveBeenCalledTimes(1)
      expect(txClient.answer.upsert).toHaveBeenCalledTimes(1)
      expect(txClient.optionResponse.findFirst).toHaveBeenCalledTimes(1)
    })

    it('should return success true on successful submission', async () => {
      const result = await service.submitRsvp({
        rsvpResponses: [],
        answersToQuestions: [],
      })

      expect(result).toEqual({ success: true })
    })
  })

  describe('submitPublicRsvp', () => {
    it('should accept a valid token and submit RSVP data', async () => {
      mockDb.wedding.findFirst.mockResolvedValue({ id: 'wedding-123' })
      mockDb.invitation.count.mockResolvedValue(1)
      mockDb.guest.count.mockResolvedValue(1)
      mockDb.household.count.mockResolvedValue(1)

      const result = await service.submitPublicRsvp({
        subUrl: 'ash-and-jamie',
        token: 'a'.repeat(32),
        rsvpResponses: [{ eventId: 'event-123', guestId: 1, rsvp: 'Attending' }],
        answersToQuestions: [
          {
            questionId: 'question-123',
            questionType: 'Text',
            response: 'Can not wait!',
            guestId: 1,
            householdId: 'household-123',
          },
        ],
      })

      expect(result).toEqual({ success: true })
    })

    it('should reject invalid or expired token', async () => {
      mockDb.wedding.findFirst.mockResolvedValue(null)

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
  })
})
