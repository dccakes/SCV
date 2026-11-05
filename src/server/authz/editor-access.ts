import { resolveWorkspaceScope } from '~/server/application/workspace/workspace-scope'
import { readWorkspaceCapabilities } from '~/server/authz/workspace-capabilities'

type SessionLike = { user?: { id?: string | null } | null } | null | undefined

/**
 * True when the session's active workspace role may change planning data
 * (owner, admin, member). Viewers and unknown roles get false.
 *
 * For route handlers outside tRPC (uploads), which otherwise only check "is signed in".
 */
export async function canEditActiveWorkspace(session: SessionLike): Promise<boolean> {
  const userId = session?.user?.id
  if (!userId) {
    return false
  }

  const scope = await resolveWorkspaceScope({ session, userId })
  return readWorkspaceCapabilities(scope.activeOrganization?.role).canEditPlanning
}
