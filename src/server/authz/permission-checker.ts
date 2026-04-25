import { TRPCError } from '@trpc/server'

import { organizationRoles } from '~/lib/auth-permissions'
import type {
  ActiveOrganization,
  AuthzContext,
  PermissionInput,
} from '~/server/authz/authorization.types'

type AuthorizeCallable = { authorize: (permissions: PermissionInput) => { success: boolean } }

export const hasPermission = (ctx: AuthzContext, permissions: PermissionInput): boolean => {
  if (!ctx.activeOrganization) {
    return false
  }

  const { role } = ctx.activeOrganization
  const roleKey = role as keyof typeof organizationRoles

  if (!role || !(roleKey in organizationRoles)) {
    return false
  }

  return (organizationRoles[roleKey] as unknown as AuthorizeCallable).authorize(permissions).success
}

export const requirePermission = (
  ctx: AuthzContext,
  permissions: PermissionInput
): ActiveOrganization => {
  if (!ctx.activeOrganization) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'No active organization in session',
    })
  }

  const { role, organizationId } = ctx.activeOrganization
  const roleKey = role as keyof typeof organizationRoles

  if (!role || !(roleKey in organizationRoles)) {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }

  // Cast required: better-auth generates role-specific authorize overloads that are
  // incompatible when accessed via a dynamic key. The cast to unknown is intentional.
  const result = (organizationRoles[roleKey] as unknown as AuthorizeCallable).authorize(permissions)

  if (!result.success) {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }

  return { organizationId, role }
}
