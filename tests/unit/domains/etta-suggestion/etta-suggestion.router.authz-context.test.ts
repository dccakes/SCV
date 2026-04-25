import { TRPCError } from '@trpc/server'

jest.mock('lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))

jest.mock('server/db', () => ({ db: {} }))

jest.mock('~/server/domains/etta-suggestion/etta-suggestion.service', () => ({
  ettaSuggestionService: {
    getAll: jest.fn(),
    getPendingByDomain: jest.fn(),
    getPendingCounts: jest.fn(),
  },
}))

import { ettaSuggestionRouter } from '~/server/domains/etta-suggestion/etta-suggestion.router'
import { ettaSuggestionService } from '~/server/domains/etta-suggestion/etta-suggestion.service'

const mockGetAll = ettaSuggestionService.getAll as jest.Mock
const mockGetPendingByDomain = ettaSuggestionService.getPendingByDomain as jest.Mock
const mockGetPendingCounts = ettaSuggestionService.getPendingCounts as jest.Mock

describe('ettaSuggestionRouter authz context plumbing', () => {
  const activeOrganization = {
    organizationId: 'org-123',
    role: 'owner' as const,
  }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('scopes getPendingByDomain to the active wedding and forwards authz', async () => {
    mockGetPendingByDomain.mockResolvedValue([{ id: 'suggestion-1' }])

    const caller = ettaSuggestionRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization,
        activeWeddingId: 'wedding-123',
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await caller.getPendingByDomain({ domain: 'vendors' })

    expect(mockGetPendingByDomain).toHaveBeenCalledWith({
      authz: {
        userId: 'user-123',
        activeOrganization,
      },
      weddingId: 'wedding-123',
      domain: 'vendors',
    })
  })

  it('scopes getPendingCounts to the active wedding and forwards authz', async () => {
    mockGetPendingCounts.mockResolvedValue({ vendors: 2, other: 1 })

    const caller = ettaSuggestionRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization,
        activeWeddingId: 'wedding-123',
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await caller.getPendingCounts()

    expect(mockGetPendingCounts).toHaveBeenCalledWith({
      authz: {
        userId: 'user-123',
        activeOrganization,
      },
      weddingId: 'wedding-123',
    })
  })

  it('forwards optional status filter for getAll', async () => {
    mockGetAll.mockResolvedValue([{ id: 'suggestion-1', status: 'failed' }])

    const caller = ettaSuggestionRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization,
        activeWeddingId: 'wedding-123',
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await caller.getAll({ status: 'failed' })

    expect(mockGetAll).toHaveBeenCalledWith({
      authz: {
        userId: 'user-123',
        activeOrganization,
      },
      weddingId: 'wedding-123',
      status: 'failed',
    })
  })

  it('rejects unauthenticated requests with UNAUTHORIZED', async () => {
    const caller = ettaSuggestionRouter.createCaller({
      auth: {
        session: null,
        activeOrganization: null,
        activeWeddingId: 'wedding-123',
        userId: null,
      },
      authz: {
        userId: '',
        activeOrganization: null,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(caller.getPendingCounts()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('rejects getAll when active wedding is missing', async () => {
    const caller = ettaSuggestionRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization,
        activeWeddingId: null,
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization,
      },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(caller.getAll({})).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' })
  })

  it('passes through service-level FORBIDDEN errors', async () => {
    mockGetPendingByDomain.mockRejectedValue(new TRPCError({ code: 'FORBIDDEN' }))

    const caller = ettaSuggestionRouter.createCaller({
      auth: {
        session: { user: { id: 'user-123' } },
        activeOrganization: { organizationId: 'org-123', role: 'viewer' },
        activeWeddingId: 'wedding-123',
        userId: 'user-123',
      },
      authz: {
        userId: 'user-123',
        activeOrganization: { organizationId: 'org-123', role: 'viewer' },
      },
      db: {} as never,
      headers: new Headers(),
    })

    await expect(caller.getPendingByDomain({ domain: 'vendors' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })
})
