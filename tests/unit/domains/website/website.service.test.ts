/**
 * Tests for Website Domain Service
 */

import { TRPCClientError } from '@trpc/client'
import { TRPCError } from '@trpc/server'

// Must mock before importing the service
jest.mock('~/server/domains/website/website.repository')
jest.mock('~/server/infrastructure/database/client')

// @ts-expect-error - Importing mock functions from mocked module
import {
  mockCreate,
  mockFindBySubUrl,
  mockFindBySubUrlWithQuestions,
  mockFindByUserId,
  mockUpdate,
  mockUpdateCoverPhoto,
  mockUpdateRsvpEnabled,
  mockWebsite,
  mockWebsiteWithQuestions,
  resetMocks as resetWebsiteMocks,
  WebsiteRepository,
} from '~/server/domains/website/website.repository'
import { WebsiteService } from '~/server/domains/website/website.service'
// @ts-expect-error - Importing mock functions from mocked module
import {
  db,
  mockEventCreate,
  mockEventFindMany,
  mockUserFindFirst,
  mockUserUpdate,
  resetMocks as resetDbMocks,
} from '~/server/infrastructure/database/client'

// Create typed aliases for mocked functions
const mockCreateFn = mockCreate as jest.Mock
const mockFindByUserIdFn = mockFindByUserId as jest.Mock
const mockFindBySubUrlFn = mockFindBySubUrl as jest.Mock
const mockFindBySubUrlWithQuestionsFn = mockFindBySubUrlWithQuestions as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock
const mockUpdateRsvpEnabledFn = mockUpdateRsvpEnabled as jest.Mock
const mockUpdateCoverPhotoFn = mockUpdateCoverPhoto as jest.Mock
const mockEventCreateFn = mockEventCreate as jest.Mock
const mockUserUpdateFn = mockUserUpdate as jest.Mock
const mockUserFindFirstFn = mockUserFindFirst as jest.Mock
const mockEventFindManyFn = mockEventFindMany as jest.Mock

describe('WebsiteService', () => {
  let websiteService: WebsiteService

  beforeEach(() => {
    resetWebsiteMocks()
    resetDbMocks()
    const mockRepository = new WebsiteRepository({})
    websiteService = new WebsiteService(mockRepository, db)
  })

  describe('createWebsite', () => {
    it('should create website with minimal required fields', async () => {
      mockEventCreateFn.mockResolvedValue({
        id: 'event-123',
        name: 'Wedding Day',
        date: null,
        venue: null,
      })
      mockUserUpdateFn.mockResolvedValue({
        id: 'user-123',
        email: 'john@example.com',
      })
      mockCreateFn.mockResolvedValue(mockWebsite)

      const result = await websiteService.createWebsite('user-123', {
        userId: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
        partnerFirstName: 'Jane',
        partnerLastName: 'Smith',
        basePath: 'https://example.com',
        email: 'john@example.com',
      })

      expect(result).toEqual(mockWebsite)
      expect(mockEventCreateFn).toHaveBeenCalledWith({
        data: {
          name: 'Wedding Day',
          userId: 'user-123',
          collectRsvp: true,
          date: null,
          venue: null,
        },
      })
      expect(mockUserUpdateFn).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          websiteUrl: 'https://example.com/johndoeandjanesmith',
          email: 'john@example.com',
          groomFirstName: 'John',
          groomLastName: 'Doe',
          brideFirstName: 'Jane',
          brideLastName: 'Smith',
        },
      })
      expect(mockCreateFn).toHaveBeenCalledWith({
        userId: 'user-123',
        url: 'https://example.com/johndoeandjanesmith',
        subUrl: 'johndoeandjanesmith',
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
      })
    })

    it('should create website with middle names', async () => {
      mockEventCreateFn.mockResolvedValue({
        id: 'event-123',
        name: 'Wedding Day',
      })
      mockUserUpdateFn.mockResolvedValue({
        id: 'user-123',
      })
      mockCreateFn.mockResolvedValue(mockWebsite)

      await websiteService.createWebsite('user-123', {
        userId: 'user-123',
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Doe',
        partnerFirstName: 'Jane',
        partnerMiddleName: 'Elizabeth',
        partnerLastName: 'Smith',
        basePath: 'https://example.com',
        email: 'john@example.com',
      })

      // Middle names don't affect subUrl generation or User/Website creation
      expect(mockCreateFn).toHaveBeenCalledWith({
        userId: 'user-123',
        url: 'https://example.com/johndoeandjanesmith',
        subUrl: 'johndoeandjanesmith',
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
      })
    })

    it('should create website with wedding date and location', async () => {
      const weddingDate = '2025-06-15T00:00:00.000Z'
      mockEventCreateFn.mockResolvedValue({
        id: 'event-123',
        name: 'Wedding Day',
        date: new Date(weddingDate),
        venue: 'Beach Resort, Hawaii',
      })
      mockUserUpdateFn.mockResolvedValue({
        id: 'user-123',
      })
      mockCreateFn.mockResolvedValue(mockWebsite)

      await websiteService.createWebsite('user-123', {
        userId: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
        partnerFirstName: 'Jane',
        partnerLastName: 'Smith',
        basePath: 'https://example.com',
        email: 'john@example.com',
        hasWeddingDetails: true,
        weddingDate,
        weddingLocation: 'Beach Resort, Hawaii',
      })

      expect(mockEventCreateFn).toHaveBeenCalledWith({
        data: {
          name: 'Wedding Day',
          userId: 'user-123',
          collectRsvp: true,
          date: new Date(weddingDate),
          venue: 'Beach Resort, Hawaii',
        },
      })
    })

    it('should create website with all optional fields', async () => {
      const weddingDate = '2025-06-15T00:00:00.000Z'
      mockEventCreateFn.mockResolvedValue({
        id: 'event-123',
        name: 'Wedding Day',
        date: new Date(weddingDate),
        venue: 'Beach Resort, Hawaii',
      })
      mockUserUpdateFn.mockResolvedValue({
        id: 'user-123',
      })
      mockCreateFn.mockResolvedValue(mockWebsite)

      const result = await websiteService.createWebsite('user-123', {
        userId: 'user-123',
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Doe',
        partnerFirstName: 'Jane',
        partnerMiddleName: 'Elizabeth',
        partnerLastName: 'Smith',
        basePath: 'https://example.com',
        email: 'john@example.com',
        hasWeddingDetails: true,
        weddingDate,
        weddingLocation: 'Beach Resort, Hawaii',
      })

      expect(result).toEqual(mockWebsite)
      expect(mockEventCreateFn).toHaveBeenCalledWith({
        data: {
          name: 'Wedding Day',
          userId: 'user-123',
          collectRsvp: true,
          date: new Date(weddingDate),
          venue: 'Beach Resort, Hawaii',
        },
      })
    })

    it('should generate lowercase subUrl from names', async () => {
      mockEventCreateFn.mockResolvedValue({
        id: 'event-123',
        name: 'Wedding Day',
      })
      mockUserUpdateFn.mockResolvedValue({
        id: 'user-123',
      })
      mockCreateFn.mockResolvedValue(mockWebsite)

      await websiteService.createWebsite('user-123', {
        userId: 'user-123',
        firstName: 'JOHN',
        lastName: 'DOE',
        partnerFirstName: 'JANE',
        partnerLastName: 'SMITH',
        basePath: 'https://example.com',
        email: 'john@example.com',
      })

      expect(mockCreateFn).toHaveBeenCalledWith(
        expect.objectContaining({
          subUrl: 'johndoeandjanesmith',
          url: 'https://example.com/johndoeandjanesmith',
        })
      )
    })
  })

  describe('updateWebsite', () => {
    it('should update website and user websiteUrl', async () => {
      const updatedWebsite = { ...mockWebsite, subUrl: 'newsuburl' }
      mockUserUpdateFn.mockResolvedValue({})
      mockUpdateFn.mockResolvedValue(updatedWebsite)

      const result = await websiteService.updateWebsite('user-123', {
        basePath: 'https://example.com',
        subUrl: 'newsuburl',
      })

      expect(result).toEqual(updatedWebsite)
      expect(mockUserUpdateFn).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { websiteUrl: 'https://example.com/newsuburl' },
      })
      expect(mockUpdateFn).toHaveBeenCalledWith('user-123', {
        isPasswordEnabled: undefined,
        password: undefined,
        subUrl: 'newsuburl',
        url: 'https://example.com/newsuburl',
      })
    })

    it('should update website password', async () => {
      const updatedWebsite = { ...mockWebsite, isPasswordEnabled: true, password: 'secret123' }
      mockUserUpdateFn.mockResolvedValue({})
      mockUpdateFn.mockResolvedValue(updatedWebsite)

      await websiteService.updateWebsite('user-123', {
        isPasswordEnabled: true,
        password: 'secret123',
      })

      expect(mockUpdateFn).toHaveBeenCalledWith('user-123', {
        isPasswordEnabled: true,
        password: 'secret123',
        subUrl: undefined,
        url: undefined,
      })
    })
  })

  describe('updateRsvpEnabled', () => {
    it('should update RSVP enabled status', async () => {
      const updatedWebsite = { ...mockWebsite, isRsvpEnabled: false }
      mockUpdateRsvpEnabledFn.mockResolvedValue(updatedWebsite)

      const result = await websiteService.updateRsvpEnabled('website-123', false)

      expect(result.isRsvpEnabled).toBe(false)
      expect(mockUpdateRsvpEnabledFn).toHaveBeenCalledWith('website-123', false)
    })
  })

  describe('updateCoverPhoto', () => {
    it('should update cover photo URL', async () => {
      const coverPhotoUrl = 'https://example.com/photo.jpg'
      const updatedWebsite = { ...mockWebsite, coverPhotoUrl }
      mockUpdateCoverPhotoFn.mockResolvedValue(updatedWebsite)

      const result = await websiteService.updateCoverPhoto('user-123', coverPhotoUrl)

      expect(result.coverPhotoUrl).toBe(coverPhotoUrl)
      expect(mockUpdateCoverPhotoFn).toHaveBeenCalledWith('user-123', coverPhotoUrl)
    })

    it('should allow null cover photo URL', async () => {
      const updatedWebsite = { ...mockWebsite, coverPhotoUrl: null }
      mockUpdateCoverPhotoFn.mockResolvedValue(updatedWebsite)

      await websiteService.updateCoverPhoto('user-123', null)

      expect(mockUpdateCoverPhotoFn).toHaveBeenCalledWith('user-123', null)
    })
  })

  describe('getByUserId', () => {
    it('should return website for valid userId', async () => {
      mockFindByUserIdFn.mockResolvedValue(mockWebsite)

      const result = await websiteService.getByUserId('user-123')

      expect(result).toEqual(mockWebsite)
      expect(mockFindByUserIdFn).toHaveBeenCalledWith('user-123')
    })

    it('should return null when userId is null', async () => {
      const result = await websiteService.getByUserId(null)

      expect(result).toBeNull()
      expect(mockFindByUserIdFn).not.toHaveBeenCalled()
    })

    it('should return null when website does not exist', async () => {
      mockFindByUserIdFn.mockResolvedValue(null)

      const result = await websiteService.getByUserId('user-123')

      expect(result).toBeNull()
    })
  })

  describe('getBySubUrl', () => {
    it('should return website for valid subUrl', async () => {
      mockFindBySubUrlFn.mockResolvedValue(mockWebsite)

      const result = await websiteService.getBySubUrl('johndoeandjanesmith')

      expect(result).toEqual(mockWebsite)
      expect(mockFindBySubUrlFn).toHaveBeenCalledWith('johndoeandjanesmith')
    })

    it('should return null when subUrl is null', async () => {
      const result = await websiteService.getBySubUrl(null)

      expect(result).toBeNull()
      expect(mockFindBySubUrlFn).not.toHaveBeenCalled()
    })

    it('should return null when subUrl is undefined', async () => {
      const result = await websiteService.getBySubUrl(undefined)

      expect(result).toBeNull()
      expect(mockFindBySubUrlFn).not.toHaveBeenCalled()
    })
  })

  describe('fetchWeddingData', () => {
    const mockWeddingUser = {
      id: 'user-123',
      groomFirstName: 'John',
      groomLastName: 'Doe',
      brideFirstName: 'Jane',
      brideLastName: 'Smith',
    }

    const mockEvents = [
      {
        id: 'event-123',
        name: 'Wedding Day',
        date: new Date('2026-06-15'),
        startTime: '14:00',
        endTime: '16:00',
        venue: 'Beach Resort',
        attire: 'Formal',
        description: 'Our special day',
        userId: 'user-123',
        collectRsvp: true,
        questions: [],
      },
    ]

    it('should fetch complete wedding data', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue(mockWebsiteWithQuestions)
      mockUserFindFirstFn.mockResolvedValue(mockWeddingUser)
      mockEventFindManyFn.mockResolvedValue(mockEvents)

      const result = await websiteService.fetchWeddingData('johndoeandjanesmith')

      expect(result).toMatchObject({
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
        website: mockWebsiteWithQuestions,
        events: mockEvents,
      })
      expect(result.date).toBeDefined()
      expect(result.daysRemaining).toBeGreaterThanOrEqual(0)
    })

    it('should throw error when website does not exist', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue(null)

      await expect(websiteService.fetchWeddingData('nonexistent')).rejects.toThrow(TRPCClientError)
    })

    it('should throw error when user does not exist', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue(mockWebsiteWithQuestions)
      mockUserFindFirstFn.mockResolvedValue(null)

      await expect(websiteService.fetchWeddingData('johndoeandjanesmith')).rejects.toThrow(
        TRPCError
      )
      await expect(websiteService.fetchWeddingData('johndoeandjanesmith')).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      })
    })
  })
})
