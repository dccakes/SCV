/**
 * Tests for Website Domain Service
 */

// Must mock before importing the service
jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

jest.mock('~/server/domains/website/website.repository')

import { requirePermission } from '~/server/authz/permission-checker'
// @ts-expect-error - Importing mock functions from mocked module
import {
  mockBelongsToWedding,
  mockFindBySubUrl,
  mockFindByWeddingId,
  mockUpdate,
  mockUpdateCoverPhoto,
  mockUpdateRsvpEnabled,
  mockWebsite,
  resetMocks as resetWebsiteMocks,
  WebsiteRepository,
} from '~/server/domains/website/website.repository'
import { WebsiteService } from '~/server/domains/website/website.service'

const mockFindByWeddingIdFn = mockFindByWeddingId as jest.Mock
const mockFindBySubUrlFn = mockFindBySubUrl as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock
const mockUpdateRsvpEnabledFn = mockUpdateRsvpEnabled as jest.Mock
const mockUpdateCoverPhotoFn = mockUpdateCoverPhoto as jest.Mock
const mockRequirePermission = requirePermission as jest.Mock
const mockBelongsToWeddingFn = mockBelongsToWedding as jest.Mock

describe('WebsiteService', () => {
  let websiteService: WebsiteService
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL
  const actorContext = {
    userId: 'actor-1',
    activeOrganization: null,
  }
  const mockHashPassword = jest.fn()
  const mockVerifyPassword = jest.fn()
  const mockCreateAccessToken = jest.fn()
  const mockVerifyAccessToken = jest.fn()

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://oswp.example'
    resetWebsiteMocks()
    mockHashPassword.mockReset()
    mockVerifyPassword.mockReset()
    mockCreateAccessToken.mockReset()
    mockVerifyAccessToken.mockReset()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-1', role: 'admin' })
    mockBelongsToWeddingFn.mockResolvedValue(true)
    const mockRepository = new WebsiteRepository({})
    const mockPasswordService = {
      hashPassword: mockHashPassword,
      verifyPassword: mockVerifyPassword,
      createAccessToken: mockCreateAccessToken,
      verifyAccessToken: mockVerifyAccessToken,
    }
    websiteService = new WebsiteService(mockRepository, mockPasswordService as never)
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl
  })

  describe('updateWebsite', () => {
    it('should update website settings', async () => {
      const updatedWebsite = { ...mockWebsite, subUrl: 'newsuburl' }
      mockUpdateFn.mockResolvedValue(updatedWebsite)

      const result = await websiteService.updateWebsite(actorContext, 'wedding-123', {
        subUrl: 'newsuburl',
      })

      expect(result).toEqual(updatedWebsite)
      expect(mockUpdateFn).toHaveBeenCalledWith('wedding-123', {
        isPasswordEnabled: undefined,
        password: undefined,
        subUrl: 'newsuburl',
      })
    })

    it('should update website password', async () => {
      const updatedWebsite = { ...mockWebsite, isPasswordEnabled: true, password: 'secret123' }
      mockUpdateFn.mockResolvedValue(updatedWebsite)
      mockHashPassword.mockReturnValue('salt:hashed-password')

      await websiteService.updateWebsite(actorContext, 'wedding-123', {
        isPasswordEnabled: true,
        password: 'secret123',
      })

      expect(mockUpdateFn).toHaveBeenCalledWith('wedding-123', {
        isPasswordEnabled: true,
        password: 'salt:hashed-password',
        subUrl: undefined,
      })
      expect(mockHashPassword).toHaveBeenCalledWith('secret123')
    })

    it('should reject update when no fields are provided', async () => {
      await expect(
        websiteService.updateWebsite(actorContext, 'wedding-123', {})
      ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      })

      expect(mockUpdateFn).not.toHaveBeenCalled()
    })
  })

  describe('updateRsvpEnabled', () => {
    it('should update RSVP enabled status', async () => {
      const updatedWebsite = { ...mockWebsite, isRsvpEnabled: false }
      mockUpdateRsvpEnabledFn.mockResolvedValue(updatedWebsite)

      const result = await websiteService.updateRsvpEnabled(
        actorContext,
        'wedding-123',
        'website-123',
        false
      )

      expect(result.isRsvpEnabled).toBe(false)
      expect(mockUpdateRsvpEnabledFn).toHaveBeenCalledWith('website-123', false)
    })

    it('should reject update when website is outside wedding scope', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        websiteService.updateRsvpEnabled(actorContext, 'wedding-123', 'website-123', false)
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })

      expect(mockUpdateRsvpEnabledFn).not.toHaveBeenCalled()
    })
  })

  describe('updateCoverPhoto', () => {
    it('should update cover photo URL', async () => {
      const coverPhotoUrl = 'https://example.com/photo.jpg'
      const updatedWebsite = { ...mockWebsite, coverPhotoUrl }
      mockUpdateCoverPhotoFn.mockResolvedValue(updatedWebsite)

      const result = await websiteService.updateCoverPhoto(
        actorContext,
        'wedding-123',
        coverPhotoUrl
      )

      expect(result.coverPhotoUrl).toBe(coverPhotoUrl)
      expect(mockUpdateCoverPhotoFn).toHaveBeenCalledWith('wedding-123', coverPhotoUrl)
    })

    it('should allow null cover photo URL', async () => {
      const updatedWebsite = { ...mockWebsite, coverPhotoUrl: null }
      mockUpdateCoverPhotoFn.mockResolvedValue(updatedWebsite)

      await websiteService.updateCoverPhoto(actorContext, 'wedding-123', null)

      expect(mockUpdateCoverPhotoFn).toHaveBeenCalledWith('wedding-123', null)
    })
  })

  describe('getByWeddingId', () => {
    it('should return website for valid weddingId', async () => {
      mockFindByWeddingIdFn.mockResolvedValue(mockWebsite)

      const result = await websiteService.getByWeddingId('wedding-123')

      expect(result).toEqual({
        ...mockWebsite,
        url: 'https://oswp.example/w/johndoeandjanesmith',
      })
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

      expect(result).toEqual({
        id: mockWebsite.id,
        createdAt: mockWebsite.createdAt,
        updatedAt: mockWebsite.updatedAt,
        weddingId: mockWebsite.weddingId,
        templateId: mockWebsite.templateId,
        subUrl: mockWebsite.subUrl,
        isPasswordEnabled: mockWebsite.isPasswordEnabled,
        isRsvpEnabled: mockWebsite.isRsvpEnabled,
        coverPhotoUrl: mockWebsite.coverPhotoUrl,
        url: 'https://oswp.example/w/johndoeandjanesmith',
      })
      expect(result).not.toHaveProperty('password')
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

  describe('verifyWebsitePassword', () => {
    it('should verify password server-side and return signed access token', async () => {
      const protectedWebsite = {
        ...mockWebsite,
        isPasswordEnabled: true,
        password: '$hashed-password',
      }
      mockFindBySubUrlFn.mockResolvedValue(protectedWebsite)
      mockVerifyPassword.mockReturnValue(true)
      mockCreateAccessToken.mockReturnValue('signed-token')

      const result = await websiteService.verifyWebsitePassword('johndoeandjanesmith', 'secret123')

      expect(result).toBe('signed-token')
      expect(mockVerifyPassword).toHaveBeenCalledWith('secret123', '$hashed-password')
    })

    it('should reject invalid password and return null token', async () => {
      const protectedWebsite = {
        ...mockWebsite,
        isPasswordEnabled: true,
        password: '$hashed-password',
      }
      mockFindBySubUrlFn.mockResolvedValue(protectedWebsite)
      mockVerifyPassword.mockReturnValue(false)

      const result = await websiteService.verifyWebsitePassword('johndoeandjanesmith', 'wrong')

      expect(result).toBeNull()
      expect(mockCreateAccessToken).not.toHaveBeenCalled()
    })
  })
})
