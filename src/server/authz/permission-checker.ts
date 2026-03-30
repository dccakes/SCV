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

  const result = organizationRoles[roleKey].authorize(permissions)

  if (!result.success) {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }

  return { organizationId, role }
}
