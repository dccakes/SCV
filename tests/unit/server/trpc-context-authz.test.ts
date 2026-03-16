jest.mock('lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}))

jest.mock('server/db', () => ({
  db: { id: 'mock-db' },
}))

import { auth } from 'lib/auth'
import { createTRPCContext } from 'server/api/trpc'

const mockGetSession = auth.api.getSession as jest.Mock

describe('createTRPCContext auth organization extraction', () => {
  beforeEach(() => {
    mockGetSession.mockReset()
  })

  it('uses session.activeOrganizationId when present', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: {
        activeOrganizationId: 'org-direct',
        activeOrganization: { id: 'org-nested' },
      },
    })

    const headers = new Headers()
    const context = await createTRPCContext({ headers })

    expect(context.auth.userId).toBe('user-1')
    expect(context.auth.sessionActiveOrganizationId).toBe('org-direct')
  })

  it('falls back to session.activeOrganization.id when direct id is missing', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: {
        activeOrganization: { id: 'org-nested' },
      },
    })

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.sessionActiveOrganizationId).toBe('org-nested')
  })

  it('returns null active organization when session shape is malformed', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: 'invalid-shape',
    })

    const context = await createTRPCContext({ headers: new Headers() })

    expect(context.auth.sessionActiveOrganizationId).toBeNull()
  })
})
