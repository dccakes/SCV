/**
 * Tests for Website Domain Router protected read boundary.
 */

jest.mock('~/lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))
jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))
jest.mock('~/server/db', () => ({ db: {} }))

jest.mock('~/server/domains/website', () => ({
  websiteService: {
    updateWebsite: jest.fn(),
    updateRsvpEnabled: jest.fn(),
    updateCoverPhoto: jest.fn(),
    getByWeddingId: jest.fn(),
    getBySubUrl: jest.fn(),
    hasPasswordAccess: jest.fn(),
    verifyWebsitePassword: jest.fn(),
    fetchWeddingData: jest.fn(),
  },
}))

jest.mock('~/server/application/website-management', () => ({
  websiteManagementService: {
    enableWebsite: jest.fn(),
    fetchWeddingData: jest.fn(),
  },
}))

jest.mock('~/server/application/rsvp-submission', () => {
  const { z } = require('zod')

  return {
    submitPublicRsvpSchema: z.object({
      subUrl: z.string().min(1),
      token: z.string().min(1),
      rsvpResponses: z.array(z.object({}).passthrough()),
      answersToQuestions: z.array(z.object({}).passthrough()),
    }),
    rsvpSubmissionService: {
      submitPublicRsvp: jest.fn(),
    },
  }
})

// @ts-expect-error - mocked module
import { websiteManagementService } from '~/server/application/website-management'
// @ts-expect-error - mocked module
import { websiteService } from '~/server/domains/website'
import { websiteRouter } from '~/server/domains/website/website.router'

const mockEnableWebsite = websiteManagementService.enableWebsite as jest.Mock
const mockFetchWeddingData = websiteManagementService.fetchWeddingData as jest.Mock
const mockGetByWeddingId = websiteService.getByWeddingId as jest.Mock

function makeAuthCaller(
  userId = 'user-123',
  activeWeddingId: string | null = 'wedding-123',
  role: 'owner' | 'admin' | 'member' | 'viewer' = 'owner'
) {
  const activeOrganization = { organizationId: 'org-123', role }

  return websiteRouter.createCaller({
    db: {} as never,
    auth: {
      userId,
      session: { user: { id: userId } } as never,
      activeWeddingId,
      activeOrganization,
    },
    authz: { userId, activeOrganization },
    headers: new Headers(),
  })
}

describe('websiteRouter', () => {
  beforeEach(() => {
    mockEnableWebsite.mockReset()
    mockFetchWeddingData.mockReset()
    mockGetByWeddingId.mockReset()
  })

  describe('create', () => {
    it('forwards authz context and active wedding to website management service', async () => {
      mockEnableWebsite.mockResolvedValue({ id: 'website-123', weddingId: 'wedding-123' })

      const caller = makeAuthCaller()
      const input = { basePath: 'https://example.com', email: 'test@example.com' }

      await caller.create(input)

      expect(mockEnableWebsite).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          activeOrganization: { organizationId: 'org-123', role: 'owner' },
        }),
        'wedding-123',
        input
      )
    })
  })

  describe('getByUserId', () => {
    it('should throw FORBIDDEN for viewer role', async () => {
      const caller = makeAuthCaller('user-123', 'wedding-123', 'viewer')
      await expect(caller.getByUserId()).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('returns the active wedding website for owner role', async () => {
      mockGetByWeddingId.mockResolvedValue({ id: 'website-123', weddingId: 'wedding-123' })

      const caller = makeAuthCaller()

      await expect(caller.getByUserId()).resolves.toEqual({
        id: 'website-123',
        weddingId: 'wedding-123',
      })
      expect(mockGetByWeddingId).toHaveBeenCalledWith('wedding-123')
    })
  })

  describe('fetchWeddingData', () => {
    it('forwards public input to website management service', async () => {
      const payload = { website: { id: 'website-123', subUrl: 'johnandjane' }, events: [] }
      mockFetchWeddingData.mockResolvedValue(payload)

      const caller = websiteRouter.createCaller({
        db: {} as never,
        auth: { userId: null, session: null },
        headers: new Headers(),
      })

      const input = { subUrl: 'johnandjane', accessToken: undefined, inviteToken: 'invite-token' }
      await expect(caller.fetchWeddingData(input)).resolves.toEqual(payload)
      expect(mockFetchWeddingData).toHaveBeenCalledWith('johnandjane', undefined, 'invite-token')
    })
  })
})
