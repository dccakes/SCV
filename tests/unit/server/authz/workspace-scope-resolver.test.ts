import { decideWorkspaceScope } from '~/server/authz/workspace-scope-resolver'

describe('decideWorkspaceScope', () => {
  it('uses the explicit session organization when it has a linked wedding', () => {
    const result = decideWorkspaceScope({
      sessionActiveOrganizationId: 'org-session',
      scopedSessionRow: {
        organizationId: 'org-session',
        isPrimaryWedding: false,
        role: 'admin',
        weddingId: 'wedding-session',
      },
      candidateScopes: [],
    })

    expect(result).toEqual({
      activeOrganization: {
        organizationId: 'org-session',
        role: 'admin',
      },
      activeWeddingId: 'wedding-session',
      clearSessionActiveOrganizationId: false,
      persistActiveOrganizationId: null,
    })
  })

  it('clears stale session organization and uses primary candidate when available', () => {
    const result = decideWorkspaceScope({
      sessionActiveOrganizationId: 'org-stale',
      scopedSessionRow: undefined,
      candidateScopes: [
        {
          organizationId: 'org-primary',
          isPrimaryWedding: true,
          role: 'owner',
          weddingId: 'wedding-primary',
        },
      ],
    })

    expect(result).toEqual({
      activeOrganization: {
        organizationId: 'org-primary',
        role: 'owner',
      },
      activeWeddingId: 'wedding-primary',
      clearSessionActiveOrganizationId: true,
      persistActiveOrganizationId: 'org-primary',
    })
  })

  it('clears stale session organization and returns empty scope when no candidates exist', () => {
    const result = decideWorkspaceScope({
      sessionActiveOrganizationId: 'org-stale',
      scopedSessionRow: undefined,
      candidateScopes: [],
    })

    expect(result).toEqual({
      activeOrganization: null,
      activeWeddingId: null,
      clearSessionActiveOrganizationId: true,
      persistActiveOrganizationId: null,
    })
  })

  it('uses primary candidate when no session organization exists', () => {
    const result = decideWorkspaceScope({
      sessionActiveOrganizationId: null,
      scopedSessionRow: undefined,
      candidateScopes: [
        {
          organizationId: 'org-primary',
          isPrimaryWedding: true,
          role: 'member',
          weddingId: 'wedding-primary',
        },
        {
          organizationId: 'org-secondary',
          isPrimaryWedding: false,
          role: 'admin',
          weddingId: 'wedding-secondary',
        },
      ],
    })

    expect(result).toEqual({
      activeOrganization: {
        organizationId: 'org-primary',
        role: 'member',
      },
      activeWeddingId: 'wedding-primary',
      clearSessionActiveOrganizationId: false,
      persistActiveOrganizationId: 'org-primary',
    })
  })

  it('uses sole candidate when no primary exists', () => {
    const result = decideWorkspaceScope({
      sessionActiveOrganizationId: null,
      scopedSessionRow: undefined,
      candidateScopes: [
        {
          organizationId: 'org-only',
          isPrimaryWedding: false,
          role: 'viewer',
          weddingId: 'wedding-only',
        },
      ],
    })

    expect(result).toEqual({
      activeOrganization: {
        organizationId: 'org-only',
        role: 'viewer',
      },
      activeWeddingId: 'wedding-only',
      clearSessionActiveOrganizationId: false,
      persistActiveOrganizationId: 'org-only',
    })
  })

  it('returns empty scope when multiple non-primary candidates exist', () => {
    const result = decideWorkspaceScope({
      sessionActiveOrganizationId: null,
      scopedSessionRow: undefined,
      candidateScopes: [
        {
          organizationId: 'org-1',
          isPrimaryWedding: false,
          role: 'owner',
          weddingId: 'wedding-1',
        },
        {
          organizationId: 'org-2',
          isPrimaryWedding: false,
          role: 'admin',
          weddingId: 'wedding-2',
        },
      ],
    })

    expect(result).toEqual({
      activeOrganization: null,
      activeWeddingId: null,
      clearSessionActiveOrganizationId: false,
      persistActiveOrganizationId: null,
    })
  })
})
