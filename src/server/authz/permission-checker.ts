import { TRPCError } from '@trpc/server'

import { auth } from 'lib/auth'

import { resolveActiveOrganization } from 'server/authz/active-organization'
import type {
  ActiveOrganization,
  AuthzContext,
  PermissionInput,
  ResolveActiveOrganizationOptions,
} from 'server/authz/authorization.types'

const permissionDenied = (): never => {
  throw new TRPCError({ code: 'FORBIDDEN' })
}

const getPermissionCheckResult = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value
  }

  if (value && typeof value === 'object') {
    const directSuccess = (value as { success?: unknown }).success
    if (typeof directSuccess === 'boolean') {
      return directSuccess
    }

    const nestedSuccess = (value as { data?: { success?: unknown } }).data?.success
    if (typeof nestedSuccess === 'boolean') {
      return nestedSuccess
    }
  }

  return false
}

export const requirePermission = async (
  ctx: AuthzContext,
  permissions: PermissionInput,
  options?: ResolveActiveOrganizationOptions
): Promise<ActiveOrganization> => {
  const activeOrganization = await resolveActiveOrganization(ctx, options)

  const hasPermission = (
    auth.api as {
      hasPermission?: (input: {
        headers: Headers
        body: {
          organizationId: string
          permissions: PermissionInput
        }
      }) => Promise<unknown>
    }
  ).hasPermission

  if (!hasPermission) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Permission checks are not configured',
    })
  }

  const result = await hasPermission({
    headers: ctx.headers,
    body: {
      organizationId: activeOrganization.organizationId,
      permissions,
    },
  })

  if (!getPermissionCheckResult(result)) {
    permissionDenied()
  }

  return activeOrganization
}
