import type { EttaContext } from '~/lib/etta/types'
import type { AuthzContext, PermissionInput } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'

export const requirePlannerAuthz = (ctx: EttaContext): AuthzContext => {
  if (!ctx.authz) {
    throw new Error('Authorization context required')
  }

  return ctx.authz
}

export const requireEttaPermission = (ctx: EttaContext, permissions: PermissionInput): void => {
  const authz = requirePlannerAuthz(ctx)
  requirePermission(authz, permissions)
}
