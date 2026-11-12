/**
 * A wedding's workspace is a Better Auth organization linked one-to-one through
 * `Wedding.organizationId`; membership in it grants access (see workspace-scope).
 * Shared by wedding creation, the legacy-wedding repair in workspace resolution,
 * and the one-time migration script, so all three build identical workspaces.
 */

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer'

export const buildWeddingOrganizationSlug = (weddingId: string): string => `wedding-${weddingId}`

export const buildWeddingOrganizationName = (couple: {
  groomFirstName: string
  brideFirstName: string
}): string => `${couple.groomFirstName} & ${couple.brideFirstName}`

/** Legacy `UserWedding.role` to organization role. Unknown roles get the least access. */
export const mapLegacyRole = (role: string): OrganizationRole => {
  if (role === 'owner') return 'owner'
  if (role === 'admin') return 'admin'
  if (role === 'editor' || role === 'member') return 'member'
  return 'viewer'
}
