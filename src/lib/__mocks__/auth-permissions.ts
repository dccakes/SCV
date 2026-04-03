/**
 * Manual mock for ~/lib/auth-permissions
 *
 * Reimplements the organizationRoles permission structure without importing
 * from better-auth (which ships ESM-only and cannot be parsed by Jest).
 *
 * The permission sets here must mirror the real auth-permissions.ts exactly.
 */

type PermissionMap = Record<string, readonly string[]>

type AuthorizeResult = { success: boolean; error?: string }

const makeRole = (grants: PermissionMap) => ({
  authorize: (permissions: PermissionMap): AuthorizeResult => {
    for (const [resource, actions] of Object.entries(permissions)) {
      const allowed = grants[resource] ?? []
      for (const action of actions) {
        if (!allowed.includes(action)) {
          return { success: false, error: `${resource}:${action} not allowed` }
        }
      }
    }
    return { success: true }
  },
})

const ownerGrants: PermissionMap = {
  organization: ['update', 'delete'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
  guest_invitation: ['read', 'create', 'send', 'resend', 'cancel'],
  guest_event: ['read', 'add_guest_to_event', 'remove_guest_from_event'],
  rsvp: ['read_responses', 'edit_response', 'export', 'reopen_submission'],
  event: ['read', 'create', 'update', 'delete', 'rsvp_policy_update'],
  guest: ['read', 'create', 'update', 'delete', 'import'],
  vendor: ['read', 'create', 'update', 'delete'],
  vendor_quote: ['read', 'create', 'update', 'delete'],
  website: ['read', 'update', 'publish', 'password_update'],
  wedding: ['read', 'update'],
}

const adminGrants: PermissionMap = {
  ...ownerGrants,
  organization: ['update'],
}

const memberGrants: PermissionMap = {
  guest_invitation: ['read', 'create', 'cancel'],
  guest_event: ['read', 'add_guest_to_event', 'remove_guest_from_event'],
  rsvp: ['read_responses', 'edit_response', 'export', 'reopen_submission'],
  event: ['read', 'create', 'update', 'delete', 'rsvp_policy_update'],
  guest: ['read', 'create', 'update', 'delete', 'import'],
  vendor: ['read', 'create', 'update', 'delete'],
  vendor_quote: ['read', 'create', 'update', 'delete'],
  website: ['read', 'update', 'publish', 'password_update'],
  wedding: ['read', 'update'],
}

const viewerGrants: PermissionMap = {
  guest_invitation: ['read'],
  guest_event: ['read'],
  rsvp: ['read_responses'],
  event: ['read'],
  guest: ['read'],
  vendor: ['read'],
  vendor_quote: ['read'],
  website: ['read'],
  wedding: ['read'],
}

export const organizationRoles = {
  owner: makeRole(ownerGrants),
  admin: makeRole(adminGrants),
  member: makeRole(memberGrants),
  viewer: makeRole(viewerGrants),
} as const

export type OrganizationRole = keyof typeof organizationRoles
