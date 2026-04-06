import { WorkspaceScopeService } from '~/server/authz/workspace-scope.service'
import type { WorkspaceScopeRow } from '~/server/authz/workspace-scope-resolver'

function makeRepository() {
  return {
    findScopeForOrganization: jest.fn(),
    findCandidateScopes: jest.fn(),
    setActiveOrganizationId: jest.fn(),
  }
}

describe('WorkspaceScopeService', () => {
  it('returns explicit session scope without persistence writes when valid', async () => {
    const repository = makeRepository()
    repository.findScopeForOrganization.mockResolvedValue({
      organizationId: 'org-1',
      isPrimaryWedding: false,
      role: 'admin',
      weddingId: 'wedding-1',
    } satisfies WorkspaceScopeRow)

    const service = new WorkspaceScopeService(repository)

    const result = await service.resolve({
      userId: 'user-1',
      sessionToken: 'tok-1',
      sessionActiveOrganizationId: 'org-1',
    })

    expect(repository.findScopeForOrganization).toHaveBeenCalledWith('user-1', 'org-1')
    expect(repository.findCandidateScopes).not.toHaveBeenCalled()
    expect(repository.setActiveOrganizationId).not.toHaveBeenCalled()
    expect(result).toEqual({
      activeOrganization: { organizationId: 'org-1', role: 'admin' },
      activeWeddingId: 'wedding-1',
    })
  })

  it('clears stale session org and persists primary fallback', async () => {
    const repository = makeRepository()
    repository.findScopeForOrganization.mockResolvedValue(undefined)
    repository.findCandidateScopes.mockResolvedValue([
      {
        organizationId: 'org-primary',
        isPrimaryWedding: true,
        role: 'owner',
        weddingId: 'wedding-primary',
      } satisfies WorkspaceScopeRow,
    ])

    const service = new WorkspaceScopeService(repository)

    const result = await service.resolve({
      userId: 'user-1',
      sessionToken: 'tok-1',
      sessionActiveOrganizationId: 'org-stale',
    })

    expect(repository.setActiveOrganizationId).toHaveBeenCalledWith('tok-1', 'org-primary')
    expect(result).toEqual({
      activeOrganization: { organizationId: 'org-primary', role: 'owner' },
      activeWeddingId: 'wedding-primary',
    })
  })

  it('returns empty scope and no writes when ambiguous and no session org', async () => {
    const repository = makeRepository()
    repository.findCandidateScopes.mockResolvedValue([
      {
        organizationId: 'org-1',
        isPrimaryWedding: false,
        role: 'owner',
        weddingId: 'wedding-1',
      } satisfies WorkspaceScopeRow,
      {
        organizationId: 'org-2',
        isPrimaryWedding: false,
        role: 'admin',
        weddingId: 'wedding-2',
      } satisfies WorkspaceScopeRow,
    ])

    const service = new WorkspaceScopeService(repository)

    const result = await service.resolve({
      userId: 'user-1',
      sessionToken: 'tok-1',
      sessionActiveOrganizationId: null,
    })

    expect(repository.setActiveOrganizationId).not.toHaveBeenCalled()
    expect(result).toEqual({
      activeOrganization: null,
      activeWeddingId: null,
    })
  })
})
