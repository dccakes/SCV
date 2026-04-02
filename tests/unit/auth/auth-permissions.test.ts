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
  emailOTP: jest.fn((options: unknown) => ({
    id: 'email-otp-plugin',
    options,
  })),
  organization: jest.fn((options: unknown) => ({
    id: 'organization-plugin',
    options,
  })),
}))

jest.mock('better-auth/client/plugins', () => ({
  emailOTPClient: jest.fn(() => ({
    id: 'email-otp-client-plugin',
  })),
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

jest.mock('~/lib/email', () => ({
  sendOrganizationInvitationEmail: jest.fn(),
  sendOtpEmail: jest.fn(),
  sendResetPasswordEmail: jest.fn(),
}))

import { authPlugins } from 'lib/auth'
import { authClientPlugins } from 'lib/auth-client'
import { authOrganizationSchema } from 'lib/auth-organization-schema'
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
  it('defines separate resources for org membership and guest invitations', () => {
    expect(authzStatement.member).toEqual(['create', 'update', 'delete'])
    expect(authzStatement.invitation).toEqual(['create', 'cancel'])
    expect(authzStatement.guest_invitation).toEqual(['read', 'create', 'send', 'resend', 'cancel'])
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
    expect(can('editor', { guest_invitation: ['send'] })).toBe(false)
    expect(can('editor', { guest_invitation: ['resend'] })).toBe(false)
    expect(can('editor', { guest_invitation: ['cancel'] })).toBe(false)
    expect(can('editor', { invitation: ['create'] })).toBe(false)
    expect(can('editor', { member: ['update'] })).toBe(false)
  })

  it('keeps viewer read-only and admin/owner invitation delivery-capable', () => {
    expect(can('viewer', { guest: ['create'] })).toBe(false)
    expect(can('viewer', { event: ['read'] })).toBe(true)
    expect(can('viewer', { wedding: ['update'] })).toBe(false)
    expect(can('editor', { wedding: ['update'] })).toBe(true)
    expect(can('admin', { guest_invitation: ['send', 'resend', 'cancel'] })).toBe(true)
    expect(can('owner', { guest_invitation: ['send', 'resend', 'cancel'] })).toBe(true)
  })

  it('allows only owner and admin to manage organization members through Better Auth resources', () => {
    expect(can('owner', { invitation: ['create'], member: ['update', 'delete'] })).toBe(true)
    expect(can('admin', { invitation: ['create'], member: ['update', 'delete'] })).toBe(true)
    expect(can('editor', { invitation: ['create'] })).toBe(false)
    expect(can('viewer', { member: ['delete'] })).toBe(false)
  })
})

describe('organization plugin wiring', () => {
  it('exports the full organization role matrix', () => {
    expect(Object.keys(organizationRoles)).toEqual(['owner', 'admin', 'editor', 'viewer'])
    expect(organizationRoles.owner.statements.invitation).toEqual(['create', 'cancel'])
    expect(organizationRoles.owner.statements.member).toEqual(['create', 'update', 'delete'])
    expect(organizationRoles.editor.statements.guest_invitation).toEqual(['read', 'create'])
    expect(organizationRoles.editor.statements.invitation).toBeUndefined()
  })

  it('maps Better Auth organization invitations to the organizationInvitation Prisma model', () => {
    expect(authOrganizationSchema).toEqual({
      invitation: {
        modelName: 'organizationInvitation',
      },
    })

    expect(authPlugins[0]).toMatchObject({
      options: expect.objectContaining({
        schema: authOrganizationSchema,
      }),
    })

    expect(authClientPlugins[0]).toMatchObject({
      options: expect.not.objectContaining({
        schema: expect.anything(),
      }),
    })
  })
})
