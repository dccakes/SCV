/**
 * Tests for Wedding Domain Service
 *
 * Testing behavior, not implementation:
 * - Users can create weddings
 * - Users cannot create duplicate weddings
 * - Wedding creation with details creates default event
 * - User profile is updated with couple info
 */

import { TRPCError } from '@trpc/server'

// Must mock before importing the service
jest.mock('~/server/domains/wedding/wedding.repository')
jest.mock('~/server/domains/event/event.service')
jest.mock('~/server/domains/user/user.service')
jest.mock('~/server/domains/guest-tag/guest-tag.service')

// @ts-expect-error - Importing mock functions from mocked module
import {
  EventService,
  mockCreateEvent,
  resetMocks as resetEventMocks,
} from '~/server/domains/event/event.service'
// @ts-expect-error - Importing mock functions from mocked module
import {
  GuestTagService,
  mockSeedInitialTags,
  resetMocks as resetTagMocks,
} from '~/server/domains/guest-tag/guest-tag.service'
// @ts-expect-error - Importing mock functions from mocked module
import {
  mockUpdateProfile,
  resetMocks as resetUserMocks,
  UserService,
} from '~/server/domains/user/user.service'
import {
  mockCreate,
  mockExistsForUser,
  mockFindByUserId,
  mockWedding,
  resetMocks as resetWeddingMocks,
  WeddingRepository,
} from '~/server/domains/wedding/wedding.repository'
import { WeddingService } from '~/server/domains/wedding/wedding.service'

// Create typed aliases for mock functions
const mockCreateFn = mockCreate as jest.Mock
const mockExistsForUserFn = mockExistsForUser as jest.Mock
const mockFindByUserIdFn = mockFindByUserId as jest.Mock
const mockCreateEventFn = mockCreateEvent as jest.Mock
const mockUpdateProfileFn = mockUpdateProfile as jest.Mock
const mockSeedInitialTagsFn = mockSeedInitialTags as jest.Mock

describe('WeddingService', () => {
  let weddingService: WeddingService

  beforeEach(() => {
    resetWeddingMocks()
    resetEventMocks()
    resetUserMocks()
    resetTagMocks()
    const mockRepository = new WeddingRepository({})
    const mockEventSvc = new EventService({})
    const mockUserSvc = new UserService({})
    const mockGuestTagService = new GuestTagService({})
    weddingService = new WeddingService(
      mockRepository,
      mockEventSvc,
      mockUserSvc,
      mockGuestTagService
    )
  })

  describe('createWedding', () => {
    it('should create wedding with couple names', async () => {
      mockExistsForUserFn.mockResolvedValue(false)
      mockCreateFn.mockResolvedValue(mockWedding)
      mockSeedInitialTagsFn.mockResolvedValue(undefined)
      mockUpdateProfileFn.mockResolvedValue({})

      const result = await weddingService.createWedding('user-123', {
        userId: 'user-123',
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
      })

      expect(result).toEqual(mockWedding)
      expect(mockCreateFn).toHaveBeenCalledWith({
        userId: 'user-123',
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
        enabledAddOns: [],
      })
    })

    it('should seed default tags when creating wedding', async () => {
      mockExistsForUserFn.mockResolvedValue(false)
      mockCreateFn.mockResolvedValue(mockWedding)
      mockSeedInitialTagsFn.mockResolvedValue(undefined)
      mockUpdateProfileFn.mockResolvedValue({})

      await weddingService.createWedding('user-123', {
        userId: 'user-123',
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
      })

      expect(mockSeedInitialTagsFn).toHaveBeenCalledWith('wedding-123', [
        { name: 'Family', color: '#3b82f6' },
        { name: 'MutualFriends', color: '#10b981' },
        { name: 'Coworkers', color: '#8b5cf6' },
        { name: 'Plus One', color: '#f59e0b' },
      ])
    })

    it('should prevent creating duplicate wedding for same user', async () => {
      mockExistsForUserFn.mockResolvedValue(true)

      await expect(
        weddingService.createWedding('user-123', {
          userId: 'user-123',
          groomFirstName: 'John',
          groomLastName: 'Doe',
          brideFirstName: 'Jane',
          brideLastName: 'Smith',
        })
      ).rejects.toThrow(TRPCError)

      expect(mockCreateFn).not.toHaveBeenCalled()
    })

    it('should create default "Wedding Day" event when date provided', async () => {
      const weddingDate = '2025-06-15T00:00:00.000Z'
      mockExistsForUserFn.mockResolvedValue(false)
      mockCreateFn.mockResolvedValue(mockWedding)
      mockSeedInitialTagsFn.mockResolvedValue(undefined)
      mockCreateEventFn.mockResolvedValue({
        id: 'event-123',
        name: 'Ceremony',
        date: new Date(weddingDate),
        venue: 'Beach Resort',
      })
      mockUpdateProfileFn.mockResolvedValue({})

      await weddingService.createWedding('user-123', {
        userId: 'user-123',
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
        hasWeddingDetails: true,
        weddingDate,
        weddingLocation: 'Beach Resort',
      })

      expect(mockCreateEventFn).toHaveBeenCalledWith('wedding-123', {
        name: 'Ceremony',
        collectRsvp: true,
        date: weddingDate,
        venue: 'Beach Resort',
      })
    })

    it('should update user profile with couple names', async () => {
      mockExistsForUserFn.mockResolvedValue(false)
      mockCreateFn.mockResolvedValue(mockWedding)
      mockSeedInitialTagsFn.mockResolvedValue(undefined)
      mockUpdateProfileFn.mockResolvedValue({})

      await weddingService.createWedding('user-123', {
        userId: 'user-123',
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
      })

      expect(mockUpdateProfileFn).toHaveBeenCalledWith('user-123', {
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
      })
    })

    it('should not create event when wedding details not provided', async () => {
      mockExistsForUserFn.mockResolvedValue(false)
      mockCreateFn.mockResolvedValue(mockWedding)
      mockSeedInitialTagsFn.mockResolvedValue(undefined)
      mockUpdateProfileFn.mockResolvedValue({})

      await weddingService.createWedding('user-123', {
        userId: 'user-123',
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
        hasWeddingDetails: false,
      })

      expect(mockCreateEventFn).not.toHaveBeenCalled()
    })
  })

  describe('getByUserId', () => {
    it('should return wedding for valid userId', async () => {
      mockFindByUserIdFn.mockResolvedValue(mockWedding)

      const result = await weddingService.getByUserId('user-123')

      expect(result).toEqual(mockWedding)
      expect(mockFindByUserIdFn).toHaveBeenCalledWith('user-123')
    })

    it('should return null when userId is null', async () => {
      const result = await weddingService.getByUserId(null)

      expect(result).toBeNull()
      expect(mockFindByUserIdFn).not.toHaveBeenCalled()
    })

    it('should return null when wedding does not exist', async () => {
      mockFindByUserIdFn.mockResolvedValue(null)

      const result = await weddingService.getByUserId('user-123')

      expect(result).toBeNull()
    })
  })

  describe('hasWedding', () => {
    it('should return true when user has wedding', async () => {
      mockExistsForUserFn.mockResolvedValue(true)

      const result = await weddingService.hasWedding('user-123')

      expect(result).toBe(true)
    })

    it('should return false when user has no wedding', async () => {
      mockExistsForUserFn.mockResolvedValue(false)

      const result = await weddingService.hasWedding('user-123')

      expect(result).toBe(false)
    })
  })
})
