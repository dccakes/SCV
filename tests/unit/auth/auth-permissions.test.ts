jest.mock('better-auth/plugins/access', () => ({
  createAccessControl: (statement: Record<string, readonly string[]>) => {
    const newRole = (grants: Record<string, readonly string[]>) => ({
      statements: grants,
      authorize: (request: Record<string, readonly string[]>) => {
        const success = Object.entries(request).every(([resource, actions]) => {
          const allowedActions = grants[resource] ?? []
          return actions.every((action) => allowedActions.includes(action))
        })

        return {
          success,
          error: success ? null : { message: 'forbidden' },
        }
      },
    })

    return {
      statements: statement,
      newRole,
    }
  },
}))

jest.mock('better-auth', () => ({
  betterAuth: jest.fn((config: unknown) => ({
    config,
    api: {},
    $Infer: {
      Session: {},
    },
  })),
}))

jest.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: jest.fn(() => ({})),
}))

jest.mock('better-auth/next-js', () => ({
  nextCookies: jest.fn(() => ({ id: 'next-cookies-plugin' })),
}))

jest.mock('better-auth/plugins', () => ({
  organization: jest.fn((options: unknown) => ({
    id: 'organization-plugin',
    options,
  })),
}))

jest.mock('better-auth/client/plugins', () => ({
  organizationClient: jest.fn((options: unknown) => ({
    id: 'organization-client-plugin',
    options,
  })),
}))

jest.mock('better-auth/react', () => ({
  createAuthClient: jest.fn((config: unknown) => ({
    config,
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    useSession: jest.fn(),
  })),
}))

jest.mock('~/env', () => ({
  env: {
    BETTER_AUTH_SECRET: 'test-secret',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    VERCEL_URL: undefined,
    VERCEL_BRANCH_URL: undefined,
  },
}))

jest.mock('~/server/db', () => ({
  db: {},
}))

import {
  authzStatement,
  type OrganizationRole,
  organizationRoles,
  type PermissionRequest,
} from 'lib/auth-permissions'

const can = (role: OrganizationRole, permissions: PermissionRequest): boolean => {
  return organizationRoles[role].authorize(permissions).success
}

describe('auth permission matrix', () => {
  it('defines approved resources and split permission actions', () => {
    expect(authzStatement.organization_member).toEqual(['read', 'invite', 'role_update', 'remove'])
    expect(authzStatement.invitation).toEqual(['read', 'create', 'send', 'resend', 'cancel'])
    expect(authzStatement.guest_event).toEqual([
      'read',
      'add_guest_to_event',
      'remove_guest_from_event',
    ])
    expect(authzStatement.rsvp).toEqual([
      'read_responses',
      'edit_response',
      'export',
      'reopen_submission',
    ])
    expect(authzStatement.wedding).toEqual(['read', 'update'])
  })

  it('allows editor guest-event assignment, but denies invitation delivery actions', () => {
    expect(can('editor', { guest_event: ['add_guest_to_event'] })).toBe(true)
    expect(can('editor', { guest_event: ['remove_guest_from_event'] })).toBe(true)
    expect(can('editor', { invitation: ['send'] })).toBe(false)
    expect(can('editor', { invitation: ['resend'] })).toBe(false)
    expect(can('editor', { invitation: ['cancel'] })).toBe(false)
  })

  it('keeps viewer read-only and admin/owner invitation delivery-capable', () => {
    expect(can('viewer', { guest: ['create'] })).toBe(false)
    expect(can('viewer', { event: ['read'] })).toBe(true)
    expect(can('viewer', { wedding: ['update'] })).toBe(false)
    expect(can('editor', { wedding: ['update'] })).toBe(true)
    expect(can('admin', { invitation: ['send', 'resend', 'cancel'] })).toBe(true)
    expect(can('owner', { invitation: ['send', 'resend', 'cancel'] })).toBe(true)
  })
})

describe('organization plugin wiring', () => {
  it('exports the full organization role matrix', () => {
    expect(Object.keys(organizationRoles)).toEqual(['owner', 'admin', 'editor', 'viewer'])
    expect(organizationRoles.owner.statements.invitation).toEqual([
      'read',
      'create',
      'send',
      'resend',
      'cancel',
    ])
    expect(organizationRoles.editor.statements.invitation).toEqual(['read', 'create'])
    expect(organizationRoles.viewer.statements.organization_member).toEqual(['read'])
  })
})
