export const organizationRoleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Member', value: 'member' },
  { label: 'Viewer', value: 'viewer' },
] as const

export type OrganizationRoleOption = (typeof organizationRoleOptions)[number]['value']

export const authUiCustomOrganizationRoles: { label: string; role: string }[] = [
  { role: 'member', label: 'Member' },
  { role: 'viewer', label: 'Viewer' },
]

const roleLabelByValue: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
}

export function getOrganizationRoleLabel(role: string): string {
  const normalizedRole = role.trim().toLowerCase()
  if (!normalizedRole) {
    return 'Member'
  }

  return (
    roleLabelByValue[normalizedRole] ??
    normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)
  )
}
