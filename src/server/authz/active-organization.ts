import { TRPCError } from '@trpc/server'

import { auth } from 'lib/auth'

import type {
  ActiveOrganization,
  AuthzContext,
  OrganizationMembership,
  ResolveActiveOrganizationOptions,
} from 'server/authz/authorization.types'

const preconditionFailed = (message: string): never => {
  throw new TRPCError({ code: 'PRECONDITION_FAILED', message })
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const getString = (value: unknown): string | null => {
  return typeof value === 'string' && value.length > 0 ? value : null
}

const getDate = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return null
}

const normalizeMembership = (value: unknown): OrganizationMembership | null => {
  if (!isRecord(value)) {
    return null
  }

  const organizationRecord = isRecord(value.organization) ? value.organization : null
  const memberRecord = isRecord(value.member) ? value.member : null

  const organizationId =
    getString(value.organizationId) ?? getString(organizationRecord?.id) ?? getString(value.id)

  if (!organizationId) {
    return null
  }

  const role = getString(value.role) ?? getString(memberRecord?.role)
  const createdAt = getDate(value.createdAt ?? memberRecord?.createdAt)

  if (!createdAt) {
    return null
  }

  return {
    organizationId,
    role,
    createdAt,
  }
}

const normalizeMemberships = (value: unknown): OrganizationMembership[] => {
  const collection = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.organizations)
      ? value.organizations
      : isRecord(value) && Array.isArray(value.data)
        ? value.data
        : []

  return collection
    .map((item) => normalizeMembership(item))
    .filter((membership): membership is OrganizationMembership => membership !== null)
}

const listMemberships = async (
  ctx: Pick<AuthzContext, 'headers'>
): Promise<OrganizationMembership[]> => {
  const listOrganizations = (
    auth.api as { listOrganizations?: (input: { headers: Headers }) => Promise<unknown> }
  ).listOrganizations

  if (!listOrganizations) {
    preconditionFailed('Organization plugin is not configured')
  }

  const response = await listOrganizations({ headers: ctx.headers })
  const memberships = normalizeMemberships(response)

  if (memberships.length === 0) {
    preconditionFailed('No organization membership found for user')
  }

  return memberships.sort((left, right) => {
    const timeDiff = left.createdAt.getTime() - right.createdAt.getTime()
    if (timeDiff !== 0) {
      return timeDiff
    }

    return left.organizationId.localeCompare(right.organizationId)
  })
}

const membershipToActiveOrganization = (
  membership: OrganizationMembership
): ActiveOrganization => ({
  organizationId: membership.organizationId,
  role: membership.role,
})

export const resolveActiveOrganization = async (
  ctx: AuthzContext,
  options?: ResolveActiveOrganizationOptions
): Promise<ActiveOrganization> => {
  const memberships = await listMemberships(ctx)
  const membershipById = new Map(
    memberships.map((membership) => [membership.organizationId, membership])
  )

  if (
    ctx.sessionActiveOrganizationId &&
    options?.organizationId &&
    ctx.sessionActiveOrganizationId !== options.organizationId
  ) {
    preconditionFailed('Requested organization does not match active session organization')
  }

  if (ctx.sessionActiveOrganizationId) {
    const sessionMembership = membershipById.get(ctx.sessionActiveOrganizationId)
    if (!sessionMembership) {
      preconditionFailed('Session active organization is invalid for this user')
    }

    return membershipToActiveOrganization(sessionMembership)
  }

  if (options?.organizationId) {
    const explicitMembership = membershipById.get(options.organizationId)
    if (!explicitMembership) {
      preconditionFailed('Specified organization is not accessible to this user')
    }

    return membershipToActiveOrganization(explicitMembership)
  }

  const fallbackMembership = memberships[0]

  if (!fallbackMembership) {
    preconditionFailed('No active organization could be resolved')
  }

  return membershipToActiveOrganization(fallbackMembership)
}
