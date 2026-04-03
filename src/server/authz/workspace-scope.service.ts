import type { WorkspaceScopeRepository } from '~/server/authz/workspace-scope.repository'
import { decideWorkspaceScope } from '~/server/authz/workspace-scope-resolver'

type WorkspaceScope = {
  activeOrganization: {
    organizationId: string
    role: string | null
  } | null
  activeWeddingId: string | null
}

type ResolveWorkspaceScopeInput = {
  userId: string
  sessionToken: string | null
  sessionActiveOrganizationId: string | null
}

type WorkspaceScopeRepositoryContract = Pick<
  WorkspaceScopeRepository,
  | 'clearActiveOrganizationId'
  | 'findCandidateScopes'
  | 'findScopeForOrganization'
  | 'persistActiveOrganizationId'
>

export class WorkspaceScopeService {
  constructor(private repository: WorkspaceScopeRepositoryContract) {}

  async resolve(input: ResolveWorkspaceScopeInput): Promise<WorkspaceScope> {
    const { userId, sessionToken, sessionActiveOrganizationId } = input

    const scopedSessionRow = sessionActiveOrganizationId
      ? await this.repository.findScopeForOrganization(userId, sessionActiveOrganizationId)
      : undefined

    const hasValidSessionScope = Boolean(scopedSessionRow?.weddingId)
    const candidateScopes =
      sessionActiveOrganizationId && hasValidSessionScope
        ? []
        : await this.repository.findCandidateScopes(userId)

    const decision = decideWorkspaceScope({
      sessionActiveOrganizationId,
      scopedSessionRow,
      candidateScopes,
    })

    if (decision.clearSessionActiveOrganizationId) {
      await this.repository.clearActiveOrganizationId(sessionToken)
    }

    if (decision.persistActiveOrganizationId) {
      await this.repository.persistActiveOrganizationId(
        sessionToken,
        decision.persistActiveOrganizationId
      )
    }

    return {
      activeOrganization: decision.activeOrganization,
      activeWeddingId: decision.activeWeddingId,
    }
  }
}
