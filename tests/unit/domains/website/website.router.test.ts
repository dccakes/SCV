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
    enableWebsite: jest.fn(),
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
import { websiteService } from '~/server/domains/website'
import { websiteRouter } from '~/server/domains/website/website.router'

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
    mockGetByWeddingId.mockReset()
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
})
