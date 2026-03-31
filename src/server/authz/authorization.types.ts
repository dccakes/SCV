export type PermissionInput = Record<string, readonly string[]>

export type ActiveOrganization = {
  organizationId: string
  role: string | null
}

export type AuthzContext = {
  userId: string
  activeOrganization: ActiveOrganization | null
}
