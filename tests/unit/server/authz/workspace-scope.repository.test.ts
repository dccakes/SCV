jest.mock('~/server/db', () => ({
  db: {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  },
}))

import { WorkspaceScopeRepository } from '~/server/authz/workspace-scope.repository'
import { db } from '~/server/db'

const mockQueryRaw = db.$queryRaw as unknown as jest.Mock
const mockExecuteRaw = db.$executeRaw as unknown as jest.Mock

describe('WorkspaceScopeRepository', () => {
  const repository = new WorkspaceScopeRepository()

  beforeEach(() => {
    mockQueryRaw.mockReset()
    mockExecuteRaw.mockReset()
  })

  it('findScopeForOrganization returns first row when present', async () => {
    mockQueryRaw.mockResolvedValue([
      {
        organizationId: 'org-1',
        isPrimaryWedding: false,
        role: 'admin',
        weddingId: 'wedding-1',
      },
      {
        organizationId: 'org-ignored',
        isPrimaryWedding: false,
        role: 'member',
        weddingId: 'wedding-ignored',
      },
    ])

    const result = await repository.findScopeForOrganization('user-1', 'org-1')

    expect(result).toEqual({
      organizationId: 'org-1',
      isPrimaryWedding: false,
      role: 'admin',
      weddingId: 'wedding-1',
    })
    expect(mockQueryRaw).toHaveBeenCalledTimes(1)
  })

  it('findCandidateScopes returns query results as-is', async () => {
    const rows = [
      {
        organizationId: 'org-primary',
        isPrimaryWedding: true,
        role: 'owner',
        weddingId: 'wedding-primary',
      },
    ]
    mockQueryRaw.mockResolvedValue(rows)

    const result = await repository.findCandidateScopes('user-1')

    expect(result).toEqual(rows)
    expect(mockQueryRaw).toHaveBeenCalledTimes(1)
  })

  it('setActiveOrganizationId is a no-op when session token is missing', async () => {
    await repository.setActiveOrganizationId(null, 'org-1')

    expect(mockExecuteRaw).not.toHaveBeenCalled()
  })

  it('setActiveOrganizationId writes when session token exists', async () => {
    mockExecuteRaw.mockResolvedValue(1)

    await repository.setActiveOrganizationId('tok-1', 'org-1')

    expect(mockExecuteRaw).toHaveBeenCalledTimes(1)
  })
})
