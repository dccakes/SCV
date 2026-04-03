import { TRPCError } from '@trpc/server'

jest.mock('lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))

jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

jest.mock('server/db', () => ({ db: {} }))

jest.mock('server/domains/vendor', () => ({
  vendorService: {
    addQuote: jest.fn(),
    createVendor: jest.fn(),
    deleteQuote: jest.fn(),
    deleteQuoteFile: jest.fn(),
    deleteVendor: jest.fn(),
    getVendorWithQuotes: jest.fn(),
    getVendorsForWedding: jest.fn(),
    saveQuoteFiles: jest.fn(),
    updateQuote: jest.fn(),
    updateStatus: jest.fn(),
    updateVendor: jest.fn(),
  },
}))

import { vendorService } from 'server/domains/vendor'
import { vendorRouter } from 'server/domains/vendor/vendor.router'

const mockGetVendorsForWedding = vendorService.getVendorsForWedding as jest.Mock

describe('vendorRouter authz context plumbing', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('scopes getAll to active wedding and forwards authz context', async () => {
    const activeOrganization = { organizationId: 'org-123', role: 'member' as const }
    mockGetVendorsForWedding.mockResolvedValue([{ id: 'vendor-1' }])

    const caller = vendorRouter.createCaller({
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

    await caller.getAll({})

    expect(mockGetVendorsForWedding).toHaveBeenCalledWith(
      { userId: 'user-123', activeOrganization },
      'wedding-123',
      undefined
    )
  })

  it('rejects unauthenticated getAll with UNAUTHORIZED', async () => {
    const caller = vendorRouter.createCaller({
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

    await expect(caller.getAll({})).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('rejects viewer getAll with FORBIDDEN', async () => {
    mockGetVendorsForWedding.mockRejectedValue(new TRPCError({ code: 'FORBIDDEN' }))

    const caller = vendorRouter.createCaller({
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

    await expect(caller.getAll({})).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('rejects getAll when active wedding is missing', async () => {
    const activeOrganization = { organizationId: 'org-123', role: 'owner' as const }
    const caller = vendorRouter.createCaller({
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

    await expect(caller.getAll({})).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
    })
  })
})
