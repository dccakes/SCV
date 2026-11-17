import {
  buildWeddingOrganizationName,
  buildWeddingOrganizationSlug,
  mapLegacyRole,
} from '~/server/authz/wedding-organization'
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
  | 'findCandidateScopes'
  | 'findScopeForOrganization'
  | 'setActiveOrganizationId'
  | 'findOrganizationlessWedding'
  | 'attachOrganization'
>

export class WorkspaceScopeService {
  constructor(private repository: WorkspaceScopeRepositoryContract) {}

  async resolve(input: ResolveWorkspaceScopeInput): Promise<WorkspaceScope> {
    const scope = await this.resolveOnce(input)
    if (scope.activeOrganization) return scope

    // No workspace: maybe their wedding predates workspaces (or was created
    // while onboarding skipped them). Give it one, then resolve into it.
    // Brand-new users have no wedding and fall through to onboarding.
    if (await this.attachWorkspaceToOrganizationlessWedding(input.userId)) {
      return this.resolveOnce(input)
    }
    return scope
  }

  /**
   * Mirrors the one-time migration (scripts/migrate-user-weddings-to-organizations):
   * a workspace named after the couple, with every linked user as a member.
   * True when the wedding now has a workspace, including when a concurrent
   * request attached it first.
   */
  private async attachWorkspaceToOrganizationlessWedding(userId: string): Promise<boolean> {
    const wedding = await this.repository.findOrganizationlessWedding(userId)
    if (!wedding) return false

    await this.repository.attachOrganization({
      weddingId: wedding.weddingId,
      name: buildWeddingOrganizationName(wedding),
      slug: buildWeddingOrganizationSlug(wedding.weddingId),
      members: wedding.members.map((member) => ({
        userId: member.userId,
        role: mapLegacyRole(member.role),
      })),
    })
    return true
  }

  private async resolveOnce(input: ResolveWorkspaceScopeInput): Promise<WorkspaceScope> {
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

    if (decision.clearSessionActiveOrganizationId || decision.persistActiveOrganizationId) {
      await this.repository.setActiveOrganizationId(
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
