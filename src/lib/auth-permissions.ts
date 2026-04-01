import { createAccessControl } from 'better-auth/plugins/access'

export const authzStatement = {
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
} as const

export const ac = createAccessControl(authzStatement)

// Match Better Auth's organization-management resources for shared UI components.
// Owner keeps org deletion while admin can still manage members and invitations.
const owner = ac.newRole({
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
})

const admin = ac.newRole({
  organization: ['update'],
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
})

const editor = ac.newRole({
  guest_invitation: ['read', 'create'],
  guest_event: ['read', 'add_guest_to_event', 'remove_guest_from_event'],
  event: ['read', 'create', 'update', 'delete', 'rsvp_policy_update'],
  guest: ['read', 'create', 'update', 'delete', 'import'],
  vendor: ['read', 'create', 'update', 'delete'],
  vendor_quote: ['read', 'create', 'update', 'delete'],
  website: ['read', 'update', 'publish'],
  wedding: ['read', 'update'],
})

const viewer = ac.newRole({
  guest_invitation: ['read'],
  guest_event: ['read'],
  event: ['read'],
  guest: ['read'],
  vendor: ['read'],
  vendor_quote: ['read'],
  website: ['read'],
  wedding: ['read'],
})

export const organizationRoles = {
  owner,
  admin,
  editor,
  viewer,
} as const

export type OrganizationRole = keyof typeof organizationRoles
export type PermissionRequest = Parameters<
  (typeof organizationRoles)[OrganizationRole]['authorize']
>[0]
