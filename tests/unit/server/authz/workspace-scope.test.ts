jest.mock('~/server/db', () => ({
  db: {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  },
}))

import {
  getSessionActiveOrganizationId,
  resolveWorkspaceScope,
} from '~/server/application/workspace/workspace-scope'
import { db } from '~/server/db'

const mockQueryRaw = db.$queryRaw as unknown as jest.Mock
const mockExecuteRaw = db.$executeRaw as unknown as jest.Mock

describe('workspace scope resolver', () => {
  beforeEach(() => {
    mockQueryRaw.mockReset()
    mockExecuteRaw.mockReset()
  })

  it('reads active organization id from nested Better Auth session shape', () => {
    expect(
      getSessionActiveOrganizationId({
        session: {
          activeOrganization: {
            id: 'org-nested',
          },
        },
      })
    ).toBe('org-nested')
  })

  it('resolves an explicit session organization when it has a linked wedding', async () => {
    mockQueryRaw.mockResolvedValueOnce([
      {
        isPrimaryWedding: false,
        organizationId: 'org-1',
        role: 'admin',
        weddingId: 'wedding-1',
      },
    ])

    const result = await resolveWorkspaceScope({
      session: { session: { activeOrganizationId: 'org-1', token: 'tok-1' } },
      userId: 'user-1',
    })

    expect(result).toEqual({
      activeOrganization: { organizationId: 'org-1', role: 'admin' },
      activeWeddingId: 'wedding-1',
    })
    expect(mockExecuteRaw).not.toHaveBeenCalled()
  })

  it('replaces an invalid session organization with the primary wedding organization', async () => {
    mockQueryRaw.mockResolvedValueOnce([])
    mockQueryRaw.mockResolvedValueOnce([
      {
        isPrimaryWedding: true,
        organizationId: 'org-primary',
        role: 'owner',
        weddingId: 'wedding-primary',
      },
    ])

    const result = await resolveWorkspaceScope({
      session: { session: { activeOrganizationId: 'org-stale', token: 'tok-1' } },
      userId: 'user-1',
    })

    expect(result).toEqual({
      activeOrganization: { organizationId: 'org-primary', role: 'owner' },
      activeWeddingId: 'wedding-primary',
    })
    expect(mockExecuteRaw).toHaveBeenCalled()
  })

  it('bootstraps from the primary wedding organization instead of the first member row', async () => {
    mockQueryRaw.mockResolvedValueOnce([
      {
        isPrimaryWedding: true,
        organizationId: 'org-primary',
        role: 'member',
        weddingId: 'wedding-primary',
      },
    ])

    const result = await resolveWorkspaceScope({
      session: { session: { token: 'tok-1' } },
      userId: 'user-1',
    })

    expect(result).toEqual({
      activeOrganization: { organizationId: 'org-primary', role: 'member' },
      activeWeddingId: 'wedding-primary',
    })
    expect(mockExecuteRaw).toHaveBeenCalled()
  })

  it('picks first candidate when multiple non-primary scopes exist and no active org', async () => {
    mockQueryRaw.mockResolvedValueOnce([
      { isPrimaryWedding: false, organizationId: 'org-1', role: 'owner', weddingId: 'wedding-1' },
      { isPrimaryWedding: false, organizationId: 'org-2', role: 'admin', weddingId: 'wedding-2' },
    ])

    const result = await resolveWorkspaceScope({
      session: { session: { token: 'tok-1' } },
      userId: 'user-1',
    })

    expect(result).toEqual({
      activeOrganization: { organizationId: 'org-1', role: 'owner' },
      activeWeddingId: 'wedding-1',
    })
    expect(mockExecuteRaw).toHaveBeenCalled()
  })
})
