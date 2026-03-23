export type PermissionInput = Record<string, readonly string[]>

export type AuthzContext = {
  userId: string
  headers: Headers
  sessionActiveOrganizationId?: string | null
}

export const toAuthzContext = (ctx: {
  auth: {
    userId: string
    sessionActiveOrganizationId?: string | null
  }
  headers: Headers
}): AuthzContext => ({
  userId: ctx.auth.userId,
  headers: ctx.headers,
  sessionActiveOrganizationId: ctx.auth.sessionActiveOrganizationId,
})

export type ResolveActiveOrganizationOptions = {
  organizationId?: string | null
}

export type ActiveOrganization = {
  organizationId: string
  role: string | null
}

export type OrganizationMembership = {
  organizationId: string
  role: string | null
  createdAt: Date
}
