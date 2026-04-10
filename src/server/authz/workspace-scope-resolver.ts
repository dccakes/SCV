import type { ActiveOrganization } from '~/server/authz/authorization.types'

export type WorkspaceScopeRow = {
  organizationId: string
  isPrimaryWedding: boolean
  role: string | null
  weddingId: string | null
}

export type WorkspaceScopeDecision = {
  activeOrganization: ActiveOrganization | null
  activeWeddingId: string | null
  clearSessionActiveOrganizationId: boolean
  persistActiveOrganizationId: string | null
}

const EMPTY_SCOPE: WorkspaceScopeDecision = {
  activeOrganization: null,
  activeWeddingId: null,
  clearSessionActiveOrganizationId: false,
  persistActiveOrganizationId: null,
}

function toActiveOrganization(row: WorkspaceScopeRow): ActiveOrganization {
  return {
    organizationId: row.organizationId,
    role: row.role,
  }
}

function hasLinkedWedding(row: WorkspaceScopeRow | null | undefined): row is WorkspaceScopeRow {
  return Boolean(row?.weddingId)
}

function findPrimaryScope(candidateScopes: WorkspaceScopeRow[]): WorkspaceScopeRow | undefined {
  return candidateScopes.find((scope) => scope.isPrimaryWedding && hasLinkedWedding(scope))
}

export function decideWorkspaceScope(input: {
  sessionActiveOrganizationId: string | null
  scopedSessionRow?: WorkspaceScopeRow
  candidateScopes: WorkspaceScopeRow[]
}): WorkspaceScopeDecision {
  const { sessionActiveOrganizationId, scopedSessionRow, candidateScopes } = input

  if (sessionActiveOrganizationId) {
    if (hasLinkedWedding(scopedSessionRow)) {
      return {
        activeOrganization: toActiveOrganization(scopedSessionRow),
        activeWeddingId: scopedSessionRow.weddingId,
        clearSessionActiveOrganizationId: false,
        persistActiveOrganizationId: null,
      }
    }

    const primaryScope = findPrimaryScope(candidateScopes)
    if (primaryScope) {
      return {
        activeOrganization: toActiveOrganization(primaryScope),
        activeWeddingId: primaryScope.weddingId,
        clearSessionActiveOrganizationId: true,
        persistActiveOrganizationId: primaryScope.organizationId,
      }
    }

    const firstScope = candidateScopes.find(hasLinkedWedding)
    if (firstScope) {
      return {
        activeOrganization: toActiveOrganization(firstScope),
        activeWeddingId: firstScope.weddingId,
        clearSessionActiveOrganizationId: true,
        persistActiveOrganizationId: firstScope.organizationId,
      }
    }

    return {
      ...EMPTY_SCOPE,
      clearSessionActiveOrganizationId: true,
    }
  }

  const primaryScope = findPrimaryScope(candidateScopes)
  if (primaryScope) {
    return {
      activeOrganization: toActiveOrganization(primaryScope),
      activeWeddingId: primaryScope.weddingId,
      clearSessionActiveOrganizationId: false,
      persistActiveOrganizationId: primaryScope.organizationId,
    }
  }

  const firstScope = candidateScopes.find(hasLinkedWedding)
  if (firstScope) {
    return {
      activeOrganization: toActiveOrganization(firstScope),
      activeWeddingId: firstScope.weddingId,
      clearSessionActiveOrganizationId: false,
      persistActiveOrganizationId: firstScope.organizationId,
    }
  }

  return EMPTY_SCOPE
}
