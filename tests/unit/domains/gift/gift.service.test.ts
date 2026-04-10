/**
 * Tests for Gift Domain Service
 */

// Must mock before importing the service
jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

jest.mock('~/server/domains/gift/gift.repository')

import { requirePermission } from '~/server/authz/permission-checker'

// @ts-expect-error - Importing mock functions from mocked module
import {
  GiftRepository,
  mockBelongsToWedding,
  mockCreateMany,
  mockFindByEventId,
  mockFindByHouseholdId,
  mockFindById,
  mockGift,
  mockUpdate,
  mockUpsert,
  resetMocks,
} from '~/server/domains/gift/gift.repository'
import { GiftService } from '~/server/domains/gift/gift.service'

// Create typed aliases for mocked functions
const mockUpdateFn = mockUpdate as jest.Mock
const mockUpsertFn = mockUpsert as jest.Mock
const mockFindByIdFn = mockFindById as jest.Mock
const mockFindByHouseholdIdFn = mockFindByHouseholdId as jest.Mock
const mockFindByEventIdFn = mockFindByEventId as jest.Mock
const mockCreateManyFn = mockCreateMany as jest.Mock
const mockBelongsToWeddingFn = mockBelongsToWedding as jest.Mock
const mockRequirePermission = requirePermission as jest.Mock

describe('GiftService', () => {
  let giftService: GiftService
  const actorContext = {
    userId: 'actor-1',
    activeOrganization: {
      organizationId: 'org-1',
      role: 'owner',
    },
  }

  beforeEach(() => {
    resetMocks()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue(undefined)
    mockBelongsToWeddingFn.mockResolvedValue(true)
    const mockRepository = new GiftRepository({})
    giftService = new GiftService(mockRepository)
  })

  describe('updateGift', () => {
    it('should update a gift successfully', async () => {
      const updatedGift = { ...mockGift, thankyou: true, description: 'Updated description' }
      mockUpdateFn.mockResolvedValue(updatedGift)

      const result = await giftService.updateGift(actorContext, 'wedding-123', {
        householdId: 'household-123',
        eventId: 'event-123',
        description: 'Updated description',
        thankyou: true,
      })

      expect(result).toEqual(updatedGift)
      expect(mockBelongsToWeddingFn).toHaveBeenCalledWith(
        'household-123',
        'event-123',
        'wedding-123'
      )
      expect(mockUpdateFn).toHaveBeenCalledWith('household-123', 'event-123', {
        description: 'Updated description',
        thankyou: true,
        thankYouSentAt: expect.any(Date),
      })
    })
  })

  describe('upsertGift', () => {
    it('should upsert a gift successfully', async () => {
      mockUpsertFn.mockResolvedValue(mockGift)

      const result = await giftService.upsertGift({
        householdId: 'household-123',
        eventId: 'event-123',
        description: 'New gift',
        thankyou: false,
      })

      expect(result).toEqual(mockGift)
      expect(mockUpsertFn).toHaveBeenCalledWith({
        householdId: 'household-123',
        eventId: 'event-123',
        description: 'New gift',
        thankyou: false,
        thankYouSentAt: null,
      })
    })
  })

  describe('getById', () => {
    it('should return a gift when found', async () => {
      mockFindByIdFn.mockResolvedValue(mockGift)

      const result = await giftService.getById('household-123', 'event-123')

      expect(result).toEqual(mockGift)
      expect(mockFindByIdFn).toHaveBeenCalledWith('household-123', 'event-123')
    })

    it('should return null when gift not found', async () => {
      mockFindByIdFn.mockResolvedValue(null)

      const result = await giftService.getById('nonexistent', 'event-123')

      expect(result).toBeNull()
    })
  })

  describe('getByHouseholdId', () => {
    it('should return all gifts for a household', async () => {
      const gifts = [mockGift, { ...mockGift, eventId: 'event-456' }]
      mockFindByHouseholdIdFn.mockResolvedValue(gifts)

      const result = await giftService.getByHouseholdId('household-123')

      expect(result).toEqual(gifts)
      expect(mockFindByHouseholdIdFn).toHaveBeenCalledWith('household-123')
    })
  })

  describe('getByEventId', () => {
    it('should return all gifts for an event', async () => {
      const gifts = [mockGift, { ...mockGift, householdId: 'household-456' }]
      mockFindByEventIdFn.mockResolvedValue(gifts)

      const result = await giftService.getByEventId('event-123')

      expect(result).toEqual(gifts)
      expect(mockFindByEventIdFn).toHaveBeenCalledWith('event-123')
    })
  })

  describe('markThankYouSent', () => {
    it('should mark thank you as sent', async () => {
      const updatedGift = { ...mockGift, thankyou: true }
      mockUpdateFn.mockResolvedValue(updatedGift)

      const result = await giftService.markThankYouSent('household-123', 'event-123')

      expect(result.thankyou).toBe(true)
      expect(mockUpdateFn).toHaveBeenCalledWith('household-123', 'event-123', {
        thankyou: true,
        thankYouSentAt: expect.any(Date),
      })
    })
  })

  describe('createForHouseholdAndEvents', () => {
    it('should create gifts for multiple events', async () => {
      mockCreateManyFn.mockResolvedValue({ count: 3 })

      const result = await giftService.createForHouseholdAndEvents('household-123', [
        'event-1',
        'event-2',
        'event-3',
      ])

      expect(result).toEqual({ count: 3 })
      expect(mockCreateManyFn).toHaveBeenCalledWith([
        { householdId: 'household-123', eventId: 'event-1', thankyou: false },
        { householdId: 'household-123', eventId: 'event-2', thankyou: false },
        { householdId: 'household-123', eventId: 'event-3', thankyou: false },
      ])
    })
  })
})
