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
  },
}))

import { auth } from 'lib/auth'
import { createTRPCContext } from 'server/api/trpc'
import { db } from 'server/db'

const mockGetSession = auth.api.getSession as jest.Mock
const mockQueryRaw = db.$queryRaw as unknown as jest.Mock

describe('createTRPCContext active organization resolution', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
    mockQueryRaw.mockReset()
  })

  it('populates activeOrganization when session has activeOrganizationId and member exists', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: { activeOrganizationId: 'org-1' },
    })
    mockQueryRaw.mockResolvedValue([{ role: 'admin' }])

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.activeOrganization).toEqual({
      organizationId: 'org-1',
      role: 'admin',
    })
  })

  it('sets activeOrganization to null when no activeOrganizationId in session', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: {},
    })

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.activeOrganization).toBeNull()
    expect(mockQueryRaw).not.toHaveBeenCalled()
  })

  it('sets activeOrganization to null when member record is not found', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: { activeOrganizationId: 'org-1' },
    })
    mockQueryRaw.mockResolvedValue([])

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.activeOrganization).toBeNull()
  })

  it('sets activeOrganization to null when session is null (unauthenticated)', async () => {
    mockGetSession.mockResolvedValue(null)

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.activeOrganization).toBeNull()
    expect(mockQueryRaw).not.toHaveBeenCalled()
  })

  it('preserves userId in auth context', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-42' },
      session: {},
    })

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.userId).toBe('user-42')
  })
})
