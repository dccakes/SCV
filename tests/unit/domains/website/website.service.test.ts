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
  mockFindByWeddingId,
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
  mockEventFindMany,
  mockWeddingFindUnique,
  resetMocks as resetDbMocks,
} from '~/server/infrastructure/database/client'

// Create typed aliases for mocked functions
const mockCreateFn = mockCreate as jest.Mock
const mockFindByWeddingIdFn = mockFindByWeddingId as jest.Mock
const mockFindBySubUrlFn = mockFindBySubUrl as jest.Mock
const mockFindBySubUrlWithQuestionsFn = mockFindBySubUrlWithQuestions as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock
const mockUpdateRsvpEnabledFn = mockUpdateRsvpEnabled as jest.Mock
const mockUpdateCoverPhotoFn = mockUpdateCoverPhoto as jest.Mock
const mockWeddingFindUniqueFn = mockWeddingFindUnique as jest.Mock
const mockEventFindManyFn = mockEventFindMany as jest.Mock

const mockWedding = {
  id: 'wedding-123',
  groomFirstName: 'John',
  groomLastName: 'Doe',
  brideFirstName: 'Jane',
  brideLastName: 'Smith',
  enabledAddOns: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

describe('WebsiteService', () => {
  let websiteService: WebsiteService

  beforeEach(() => {
    resetWebsiteMocks()
    resetDbMocks()
    const mockRepository = new WebsiteRepository({})
    websiteService = new WebsiteService(mockRepository, db)
  })

  describe('enableWebsite', () => {
    it('should enable website add-on for existing wedding', async () => {
      mockWeddingFindUniqueFn.mockResolvedValue(mockWedding)
      mockFindBySubUrlFn.mockResolvedValue(null) // URL not taken
      mockCreateFn.mockResolvedValue(mockWebsite)

      const result = await websiteService.enableWebsite('wedding-123', {
        basePath: 'https://example.com',
        email: 'john@example.com',
      })

      expect(result).toEqual(mockWebsite)
      expect(mockWeddingFindUniqueFn).toHaveBeenCalledWith({
        where: { id: 'wedding-123' },
      })
      expect(mockCreateFn).toHaveBeenCalledWith({
        weddingId: 'wedding-123',
        url: 'https://example.com/johndoeandjanesmith',
        subUrl: 'johndoeandjanesmith',
      })
    })

    it('should generate lowercase subUrl from wedding couple names', async () => {
      const weddingWithCaps = {
        ...mockWedding,
        groomFirstName: 'JOHN',
        groomLastName: 'DOE',
        brideFirstName: 'JANE',
        brideLastName: 'SMITH',
      }
      mockWeddingFindUniqueFn.mockResolvedValue(weddingWithCaps)
      mockFindBySubUrlFn.mockResolvedValue(null)
      mockCreateFn.mockResolvedValue(mockWebsite)

      await websiteService.enableWebsite('wedding-123', {
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

    it('should throw error when wedding not found', async () => {
      mockWeddingFindUniqueFn.mockResolvedValue(null)

      await expect(
        websiteService.enableWebsite('wedding-123', {
          basePath: 'https://example.com',
          email: 'john@example.com',
        })
      ).rejects.toThrow(TRPCError)

      await expect(
        websiteService.enableWebsite('wedding-123', {
          basePath: 'https://example.com',
          email: 'john@example.com',
        })
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('should throw error when URL already taken', async () => {
      mockWeddingFindUniqueFn.mockResolvedValue(mockWedding)
      mockFindBySubUrlFn.mockResolvedValue(mockWebsite) // URL is taken

      await expect(
        websiteService.enableWebsite('wedding-123', {
          basePath: 'https://example.com',
          email: 'john@example.com',
        })
      ).rejects.toThrow(TRPCError)

      await expect(
        websiteService.enableWebsite('wedding-123', {
          basePath: 'https://example.com',
          email: 'john@example.com',
        })
      ).rejects.toMatchObject({
        code: 'CONFLICT',
      })
    })
  })

  describe('updateWebsite', () => {
    it('should update website settings', async () => {
      const updatedWebsite = { ...mockWebsite, subUrl: 'newsuburl' }
      mockUpdateFn.mockResolvedValue(updatedWebsite)

      const result = await websiteService.updateWebsite('wedding-123', {
        basePath: 'https://example.com',
        subUrl: 'newsuburl',
      })

      expect(result).toEqual(updatedWebsite)
      expect(mockUpdateFn).toHaveBeenCalledWith('wedding-123', {
        isPasswordEnabled: undefined,
        password: undefined,
        subUrl: 'newsuburl',
        url: 'https://example.com/newsuburl',
      })
    })

    it('should update website password', async () => {
      const updatedWebsite = { ...mockWebsite, isPasswordEnabled: true, password: 'secret123' }
      mockUpdateFn.mockResolvedValue(updatedWebsite)

      await websiteService.updateWebsite('wedding-123', {
        isPasswordEnabled: true,
        password: 'secret123',
      })

      expect(mockUpdateFn).toHaveBeenCalledWith('wedding-123', {
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

      const result = await websiteService.updateCoverPhoto('wedding-123', coverPhotoUrl)

      expect(result.coverPhotoUrl).toBe(coverPhotoUrl)
      expect(mockUpdateCoverPhotoFn).toHaveBeenCalledWith('wedding-123', coverPhotoUrl)
    })

    it('should allow null cover photo URL', async () => {
      const updatedWebsite = { ...mockWebsite, coverPhotoUrl: null }
      mockUpdateCoverPhotoFn.mockResolvedValue(updatedWebsite)

      await websiteService.updateCoverPhoto('wedding-123', null)

      expect(mockUpdateCoverPhotoFn).toHaveBeenCalledWith('wedding-123', null)
    })
  })

  describe('getByWeddingId', () => {
    it('should return website for valid weddingId', async () => {
      mockFindByWeddingIdFn.mockResolvedValue(mockWebsite)

      const result = await websiteService.getByWeddingId('wedding-123')

      expect(result).toEqual(mockWebsite)
      expect(mockFindByWeddingIdFn).toHaveBeenCalledWith('wedding-123')
    })

    it('should return null when weddingId is null', async () => {
      const result = await websiteService.getByWeddingId(null)

      expect(result).toBeNull()
      expect(mockFindByWeddingIdFn).not.toHaveBeenCalled()
    })

    it('should return null when website does not exist', async () => {
      mockFindByWeddingIdFn.mockResolvedValue(null)

      const result = await websiteService.getByWeddingId('wedding-123')

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
        weddingId: 'wedding-123',
        collectRsvp: true,
        questions: [],
      },
    ]

    it('should fetch complete wedding data', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue(mockWebsiteWithQuestions)
      mockWeddingFindUniqueFn.mockResolvedValue(mockWedding)
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

    it('should throw error when wedding does not exist', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue(mockWebsiteWithQuestions)
      mockWeddingFindUniqueFn.mockResolvedValue(null)

      await expect(websiteService.fetchWeddingData('johndoeandjanesmith')).rejects.toThrow(
        TRPCError
      )
      await expect(websiteService.fetchWeddingData('johndoeandjanesmith')).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      })
    })
  })
})
