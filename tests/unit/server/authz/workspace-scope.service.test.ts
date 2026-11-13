import { WorkspaceScopeService } from '~/server/authz/workspace-scope.service'
import type { WorkspaceScopeRow } from '~/server/authz/workspace-scope-resolver'

function makeRepository() {
  return {
    findScopeForOrganization: jest.fn(),
    findCandidateScopes: jest.fn(),
    setActiveOrganizationId: jest.fn(),
    findOrganizationlessWedding: jest.fn().mockResolvedValue(null),
    attachOrganization: jest.fn().mockResolvedValue(true),
  }
}

const ownerScope = {
  organizationId: 'org-new',
  isPrimaryWedding: true,
  role: 'owner',
  weddingId: 'wedding-legacy',
} satisfies WorkspaceScopeRow

const legacyWedding = {
  weddingId: 'wedding-legacy',
  groomFirstName: 'Sam',
  brideFirstName: 'Alex',
  members: [
    { userId: 'user-1', role: 'owner' },
    { userId: 'user-2', role: 'editor' },
  ],
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

  it('picks first candidate and persists it when multiple non-primary candidates exist', async () => {
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

    expect(repository.setActiveOrganizationId).toHaveBeenCalledWith('tok-1', 'org-1')
    expect(result).toEqual({
      activeOrganization: { organizationId: 'org-1', role: 'owner' },
      activeWeddingId: 'wedding-1',
    })
  })

  describe('weddings created without a workspace (before organizations existed)', () => {
    it('gives the wedding its workspace, with legacy roles mapped, then resolves into it', async () => {
      const repository = makeRepository()
      repository.findCandidateScopes.mockResolvedValueOnce([]).mockResolvedValueOnce([ownerScope])
      repository.findOrganizationlessWedding.mockResolvedValue(legacyWedding)

      const result = await new WorkspaceScopeService(repository).resolve({
        userId: 'user-1',
        sessionToken: 'tok-1',
        sessionActiveOrganizationId: null,
      })

      expect(repository.findOrganizationlessWedding).toHaveBeenCalledWith('user-1')
      expect(repository.attachOrganization).toHaveBeenCalledWith({
        weddingId: 'wedding-legacy',
        name: 'Sam & Alex',
        slug: 'wedding-wedding-legacy',
        members: [
          { userId: 'user-1', role: 'owner' },
          { userId: 'user-2', role: 'member' },
        ],
      })
      expect(result).toEqual({
        activeOrganization: { organizationId: 'org-new', role: 'owner' },
        activeWeddingId: 'wedding-legacy',
      })
    })

    it('still resolves into the workspace when a concurrent request attached it first', async () => {
      const repository = makeRepository()
      repository.findCandidateScopes.mockResolvedValueOnce([]).mockResolvedValueOnce([ownerScope])
      repository.findOrganizationlessWedding.mockResolvedValue(legacyWedding)
      repository.attachOrganization.mockResolvedValue(false)

      const result = await new WorkspaceScopeService(repository).resolve({
        userId: 'user-1',
        sessionToken: 'tok-1',
        sessionActiveOrganizationId: null,
      })

      expect(result.activeWeddingId).toBe('wedding-legacy')
    })

    it('leaves brand-new users without a wedding alone (they get onboarding)', async () => {
      const repository = makeRepository()
      repository.findCandidateScopes.mockResolvedValue([])

      const result = await new WorkspaceScopeService(repository).resolve({
        userId: 'user-new',
        sessionToken: 'tok-1',
        sessionActiveOrganizationId: null,
      })

      expect(repository.attachOrganization).not.toHaveBeenCalled()
      expect(repository.findCandidateScopes).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ activeOrganization: null, activeWeddingId: null })
    })

    it('never looks for legacy weddings when the user already has a workspace', async () => {
      const repository = makeRepository()
      repository.findCandidateScopes.mockResolvedValue([ownerScope])

      await new WorkspaceScopeService(repository).resolve({
        userId: 'user-1',
        sessionToken: 'tok-1',
        sessionActiveOrganizationId: null,
      })

      expect(repository.findOrganizationlessWedding).not.toHaveBeenCalled()
    })
  })
})
