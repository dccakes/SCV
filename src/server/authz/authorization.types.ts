export type PermissionInput = Record<string, readonly string[]>

export type ActiveOrganization = {
  organizationId: string
  role: string | null
}

export type AuthzContext = {
  userId: string
  activeOrganization: ActiveOrganization | null
}

export const toAuthzContext = (ctx: {
  auth: {
    userId: string
    activeOrganization: ActiveOrganization | null
  }
}): AuthzContext => ({
  userId: ctx.auth.userId,
  activeOrganization: ctx.auth.activeOrganization,
})
