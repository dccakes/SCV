import { TRPCError } from '@trpc/server'

import { organizationRoles } from '~/lib/auth-permissions'
import type {
  ActiveOrganization,
  AuthzContext,
  PermissionInput,
} from '~/server/authz/authorization.types'

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
  type AuthorizeCallable = { authorize: (permissions: PermissionInput) => { success: boolean } }
  const result = (organizationRoles[roleKey] as unknown as AuthorizeCallable).authorize(permissions)

  if (!result.success) {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }

  return { organizationId, role }
}
