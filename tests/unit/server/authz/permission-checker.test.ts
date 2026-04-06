jest.mock('~/lib/auth-permissions')

import type { AuthzContext } from 'server/authz/authorization.types'
import { requirePermission } from 'server/authz/permission-checker'

const ownerCtx: AuthzContext = {
  userId: 'user-1',
  activeOrganization: { organizationId: 'org-1', role: 'owner' },
}

const adminCtx: AuthzContext = {
  userId: 'user-2',
  activeOrganization: { organizationId: 'org-1', role: 'admin' },
}

const memberCtx: AuthzContext = {
  userId: 'user-3',
  activeOrganization: { organizationId: 'org-1', role: 'member' },
}

const viewerCtx: AuthzContext = {
  userId: 'user-4',
  activeOrganization: { organizationId: 'org-1', role: 'viewer' },
}

const noOrgCtx: AuthzContext = {
  userId: 'user-5',
  activeOrganization: null,
}

describe('requirePermission', () => {
  it('returns activeOrganization when permission is granted', () => {
    const result = requirePermission(ownerCtx, { event: ['create'] })
    expect(result).toEqual({ organizationId: 'org-1', role: 'owner' })
  })

  it('throws FORBIDDEN when viewer attempts a write action', () => {
    expect(() => requirePermission(viewerCtx, { event: ['create'] })).toThrow(
      expect.objectContaining({ code: 'FORBIDDEN' })
    )
  })

  it('throws FORBIDDEN when member attempts guest invitation send', () => {
    expect(() => requirePermission(memberCtx, { guest_invitation: ['send'] })).toThrow(
      expect.objectContaining({ code: 'FORBIDDEN' })
    )
  })

  it('allows member to add guests to events', () => {
    expect(() =>
      requirePermission(memberCtx, { guest_event: ['add_guest_to_event'] })
    ).not.toThrow()
  })

  it('allows admin to send guest invitations', () => {
    expect(() => requirePermission(adminCtx, { guest_invitation: ['send'] })).not.toThrow()
  })

  it('allows admin to manage organization members through Better Auth resources', () => {
    expect(() => requirePermission(adminCtx, { invitation: ['create'] })).not.toThrow()
    expect(() => requirePermission(adminCtx, { member: ['update', 'delete'] })).not.toThrow()
  })

  it('throws PRECONDITION_FAILED when no active organization in context', () => {
    expect(() => requirePermission(noOrgCtx, { event: ['create'] })).toThrow(
      expect.objectContaining({ code: 'PRECONDITION_FAILED' })
    )
  })

  it('throws FORBIDDEN for unknown role', () => {
    const unknownRoleCtx: AuthzContext = {
      userId: 'user-x',
      activeOrganization: { organizationId: 'org-1', role: 'superuser' },
    }
    expect(() => requirePermission(unknownRoleCtx, { event: ['read'] })).toThrow(
      expect.objectContaining({ code: 'FORBIDDEN' })
    )
  })
})
