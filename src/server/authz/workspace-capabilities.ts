import { organizationRoles } from '~/lib/auth-permissions'
import type { PermissionInput } from '~/server/authz/authorization.types'

export type WorkspaceCapabilities = {
  canInviteMembers: boolean
  canManageMembers: boolean
  canSendInvites: boolean
  canViewPlanning: boolean
}

const EMPTY_CAPABILITIES: WorkspaceCapabilities = {
  canInviteMembers: false,
  canManageMembers: false,
  canSendInvites: false,
  canViewPlanning: false,
}

export function readWorkspaceCapabilities(role: string | null | undefined): WorkspaceCapabilities {
  const roleKey = role as keyof typeof organizationRoles
  if (!role || !(roleKey in organizationRoles)) {
    return EMPTY_CAPABILITIES
  }

  type AuthorizeCallable = {
    authorize: (permissions: PermissionInput) => { success: boolean }
  }
  const authorize = (organizationRoles[roleKey] as unknown as AuthorizeCallable).authorize
  const can = (permissions: PermissionInput) => authorize(permissions).success

  return {
    canInviteMembers: can({ invitation: ['create'] }),
    canManageMembers: can({ member: ['update'] }),
    canSendInvites: can({ guest_invitation: ['send'] }),
    canViewPlanning: can({ wedding: ['read'] }),
  }
}

export type HomeView = 'marketing' | 'app'

/**
 * What `/` shows. 'app' renders the signed-in home, which sends members with a
 * wedding to the dashboard and shows onboarding (create your wedding) to
 * everyone else, including fresh self-signups that have no workspace yet.
 * Members whose role can't view planning (viewers) keep the marketing page.
 */
export function resolveHomeView(input: {
  signedIn: boolean
  activeOrganization: { organizationId: string; role: string | null } | null
}): HomeView {
  if (!input.signedIn) return 'marketing'
  if (!input.activeOrganization) return 'app'
  return readWorkspaceCapabilities(input.activeOrganization.role).canViewPlanning
    ? 'app'
    : 'marketing'
}
