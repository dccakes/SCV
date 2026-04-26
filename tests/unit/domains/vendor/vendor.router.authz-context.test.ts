import { TRPCError } from '@trpc/server'

jest.mock('lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))

jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

jest.mock('server/db', () => ({ db: {} }))

jest.mock('server/application/vendor-insights', () => ({
  vendorInsightsService: {
    getVendor: jest.fn(),
    listVendors: jest.fn(),
  },
}))

jest.mock('server/domains/vendor', () => ({
  vendorService: {
    addVendorNote: jest.fn(),
    addQuote: jest.fn(),
    createVendor: jest.fn(),
    deleteQuote: jest.fn(),
    deleteQuoteFile: jest.fn(),
    deleteVendor: jest.fn(),
    getCategoryConfig: jest.fn(),
    getNotes: jest.fn(),
    getVendorWithQuotes: jest.fn(),
    getVendorsForWedding: jest.fn(),
    saveQuoteFiles: jest.fn(),
    updateQuote: jest.fn(),
    updateStatus: jest.fn(),
    updateVendor: jest.fn(),
    upsertCategoryConfig: jest.fn(),
  },
}))

import { vendorInsightsService } from 'server/application/vendor-insights'
import { vendorService } from 'server/domains/vendor'
import { vendorRouter } from 'server/domains/vendor/vendor.router'

const mockListVendors = vendorInsightsService.listVendors as jest.Mock
const mockGetNotes = vendorService.getNotes as jest.Mock
const mockUpsertCategoryConfig = vendorService.upsertCategoryConfig as jest.Mock

describe('vendorRouter authz context plumbing', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('scopes getAll to active wedding and forwards authz context', async () => {
    const activeOrganization = { organizationId: 'org-123', role: 'member' as const }
    mockListVendors.mockResolvedValue([{ id: 'vendor-1' }])

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

    expect(mockListVendors).toHaveBeenCalledWith(
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
    mockListVendors.mockRejectedValue(new TRPCError({ code: 'FORBIDDEN' }))

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

  it('scopes getNotes to active wedding and forwards authz context', async () => {
    const activeOrganization = { organizationId: 'org-123', role: 'member' as const }
    mockGetNotes.mockResolvedValue([{ id: 'note-1' }])

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

    await caller.getNotes({ vendorId: 'vendor-1' })

    expect(mockGetNotes).toHaveBeenCalledWith(
      { userId: 'user-123', activeOrganization },
      'vendor-1',
      'wedding-123'
    )
  })

  it('scopes upsertCategoryConfig to active wedding and forwards authz context', async () => {
    const activeOrganization = { organizationId: 'org-123', role: 'owner' as const }
    const fieldDefinitions = [
      { key: 'capacity', label: 'Capacity', type: 'number', displayOrder: 1 },
    ]
    mockUpsertCategoryConfig.mockResolvedValue({ id: 'config-1' })

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

    await caller.upsertCategoryConfig({
      category: 'VENUE',
      fieldDefinitions,
    })

    expect(mockUpsertCategoryConfig).toHaveBeenCalledWith(
      { userId: 'user-123', activeOrganization },
      'wedding-123',
      'VENUE',
      fieldDefinitions
    )
  })
})
