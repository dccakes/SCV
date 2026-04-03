jest.mock('lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}))

jest.mock('server/db', () => ({
  db: {
    id: 'mock-db',
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  },
}))

import { auth } from 'lib/auth'
import { createTRPCContext } from 'server/api/trpc'
import { db } from 'server/db'

const mockGetSession = auth.api.getSession as jest.Mock
const mockQueryRaw = db.$queryRaw as unknown as jest.Mock
const mockExecuteRaw = db.$executeRaw as unknown as jest.Mock

describe('createTRPCContext active organization resolution', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
    mockQueryRaw.mockReset()
    mockExecuteRaw.mockReset()
  })

  it('populates activeOrganization when session has activeOrganizationId and member exists', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: { activeOrganizationId: 'org-1' },
    })
    mockQueryRaw.mockResolvedValue([
      { organizationId: 'org-1', role: 'admin', weddingId: 'wedding-1' },
    ])

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.activeOrganization).toEqual({
      organizationId: 'org-1',
      role: 'admin',
    })
    expect(context.auth.activeWeddingId).toBe('wedding-1')
  })

  it('auto-activates the primary wedding organization when session has no activeOrganizationId', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: { token: 'tok-1' },
    })
    mockQueryRaw.mockResolvedValueOnce([
      { organizationId: 'org-1', role: 'owner', weddingId: 'wedding-1' },
    ])
    mockExecuteRaw.mockResolvedValue(1)

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.activeOrganization).toEqual({ organizationId: 'org-1', role: 'owner' })
    expect(context.auth.activeWeddingId).toBe('wedding-1')
  })

  it('sets activeOrganization to null when no activeOrganizationId and no member rows', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: { token: 'tok-1' },
    })
    mockQueryRaw.mockResolvedValueOnce([])
    mockQueryRaw.mockResolvedValueOnce([])

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.activeOrganization).toBeNull()
    expect(context.auth.activeWeddingId).toBeNull()
  })

  it('repairs a stale active organization when the primary wedding organization is still valid', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: { activeOrganizationId: 'org-stale', token: 'tok-1' },
    })
    mockQueryRaw.mockResolvedValueOnce([])
    mockQueryRaw.mockResolvedValueOnce([
      { organizationId: 'org-1', role: 'owner', weddingId: 'wedding-1' },
    ])
    mockExecuteRaw.mockResolvedValue(1)

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.activeOrganization).toEqual({
      organizationId: 'org-1',
      role: 'owner',
    })
    expect(context.auth.activeWeddingId).toBe('wedding-1')
  })

  it('sets activeOrganization to null when session is null (unauthenticated)', async () => {
    mockGetSession.mockResolvedValue(null)

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.activeOrganization).toBeNull()
    expect(context.auth.activeWeddingId).toBeNull()
    expect(mockQueryRaw).not.toHaveBeenCalled()
  })

  it('preserves userId in auth context', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-42' },
      session: { token: 'tok-42' },
    })
    mockQueryRaw.mockResolvedValue([])

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.userId).toBe('user-42')
  })
})
