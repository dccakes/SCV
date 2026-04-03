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
