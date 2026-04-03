import type { EttaContext } from '~/lib/etta/types'
import type { AuthzContext, PermissionInput } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'

// Etta permission model:
// - Planner tools must authorize against the acting user's AuthzContext.
// - Audit attribution is handled separately by the agent runtime as actorType='etta'.
// Keep both guarantees aligned with src/lib/etta/agent.ts.
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
