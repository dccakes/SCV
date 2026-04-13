import { TRPCClientError } from '@trpc/client'
import { TRPCError } from '@trpc/server'

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

jest.mock('~/server/domains/website/website.repository')
jest.mock('~/server/domains/wedding/wedding.repository')
jest.mock('~/server/domains/event/event.repository')

import { WebsiteManagementService } from '~/server/application/website-management/website-management.service'
import { requirePermission } from '~/server/authz/permission-checker'
import {
  EventRepository,
  mockEvent,
  mockFindByWeddingIdWithQuestions,
  resetMocks as resetEventRepoMocks,
} from '~/server/domains/event/event.repository'
import {
  mockCreate,
  mockFindBySubUrl,
  mockFindBySubUrlWithQuestions,
  mockWebsite,
  mockWebsiteWithQuestions,
  resetMocks as resetWebsiteRepoMocks,
  WebsiteRepository,
} from '~/server/domains/website/website.repository'
import {
  mockFindById as mockFindWeddingById,
  mockWedding,
  resetMocks as resetWeddingRepoMocks,
  WeddingRepository,
} from '~/server/domains/wedding/wedding.repository'

const mockRequirePermission = requirePermission as jest.Mock
const mockCreateFn = mockCreate as jest.Mock
const mockFindBySubUrlFn = mockFindBySubUrl as jest.Mock
const mockFindBySubUrlWithQuestionsFn = mockFindBySubUrlWithQuestions as jest.Mock
const mockFindWeddingByIdFn = mockFindWeddingById as jest.Mock
const mockFindByWeddingIdWithQuestionsFn = mockFindByWeddingIdWithQuestions as jest.Mock

const actorContext = {
  userId: 'actor-1',
  activeOrganization: null,
}

describe('WebsiteManagementService', () => {
  let service: WebsiteManagementService
  const mockVerifyAccessToken = jest.fn()

  beforeEach(() => {
    resetWebsiteRepoMocks()
    resetWeddingRepoMocks()
    resetEventRepoMocks()
    mockVerifyAccessToken.mockReset()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-1', role: 'admin' })

    const websiteRepo = new WebsiteRepository({})
    const weddingRepo = new WeddingRepository({})
    const eventRepo = new EventRepository({})

    service = new WebsiteManagementService(websiteRepo, weddingRepo, eventRepo, {
      verifyAccessToken: mockVerifyAccessToken,
    } as never)
  })

  describe('enableWebsite', () => {
    it('creates website from wedding data', async () => {
      mockFindWeddingByIdFn.mockResolvedValue(mockWedding)
      mockFindBySubUrlFn.mockResolvedValue(null)
      mockCreateFn.mockResolvedValue(mockWebsite)

      const result = await service.enableWebsite(actorContext, 'wedding-123', {
        basePath: 'https://example.com',
        email: 'john@example.com',
      })

      expect(result).toEqual(mockWebsite)
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { website: ['publish'] })
      expect(mockCreateFn).toHaveBeenCalledWith({
        weddingId: 'wedding-123',
        url: 'https://example.com/johndoeandjanesmith',
        subUrl: 'johndoeandjanesmith',
      })
    })

    it('fails when wedding does not exist', async () => {
      mockFindWeddingByIdFn.mockResolvedValue(null)

      await expect(
        service.enableWebsite(actorContext, 'wedding-123', {
          basePath: 'https://example.com',
          email: 'john@example.com',
        })
      ).rejects.toMatchObject({ code: 'NOT_FOUND' })

      expect(mockCreateFn).not.toHaveBeenCalled()
    })

    it('fails when generated url is already taken', async () => {
      mockFindWeddingByIdFn.mockResolvedValue(mockWedding)
      mockFindBySubUrlFn.mockResolvedValue(mockWebsite)

      await expect(
        service.enableWebsite(actorContext, 'wedding-123', {
          basePath: 'https://example.com',
          email: 'john@example.com',
        })
      ).rejects.toMatchObject({ code: 'CONFLICT' })

      expect(mockCreateFn).not.toHaveBeenCalled()
    })
  })

  describe('fetchWeddingData', () => {
    it('returns public page data with events', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue(mockWebsiteWithQuestions)
      mockFindWeddingByIdFn.mockResolvedValue(mockWedding)
      mockFindByWeddingIdWithQuestionsFn.mockResolvedValue([mockEvent])

      const result = await service.fetchWeddingData('johndoeandjanesmith', undefined)

      expect(result.groomFirstName).toBe('John')
      expect(result.website).toMatchObject({ id: 'website-123', subUrl: 'johndoeandjanesmith' })
      expect(result.website).not.toHaveProperty('password')
      expect(result.events).toHaveLength(1)
    })

    it('throws when website does not exist', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue(null)

      await expect(service.fetchWeddingData('missing-site', undefined)).rejects.toThrow(
        TRPCClientError
      )
    })

    it('throws forbidden when protected website access token is invalid', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue({
        ...mockWebsiteWithQuestions,
        isPasswordEnabled: true,
        password: '$hashed-password',
      })
      mockVerifyAccessToken.mockReturnValue(false)

      await expect(
        service.fetchWeddingData('johndoeandjanesmith', undefined)
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })

    it('throws when wedding lookup fails for website', async () => {
      mockFindBySubUrlWithQuestionsFn.mockResolvedValue(mockWebsiteWithQuestions)
      mockFindWeddingByIdFn.mockResolvedValue(null)

      await expect(service.fetchWeddingData('johndoeandjanesmith', undefined)).rejects.toThrow(
        TRPCError
      )
      await expect(
        service.fetchWeddingData('johndoeandjanesmith', undefined)
      ).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      })
    })
  })
})
