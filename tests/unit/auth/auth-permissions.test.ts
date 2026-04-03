import { readFileSync } from 'node:fs'

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

import { authPlugins, resolveTrustedOrigins } from 'lib/auth'
import { authClientPlugins, resolveAuthClientBaseUrl } from 'lib/auth-client'
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

  it('allows member guest-event assignment, but denies invitation delivery actions', () => {
    expect(can('member', { guest_event: ['add_guest_to_event'] })).toBe(true)
    expect(can('member', { guest_event: ['remove_guest_from_event'] })).toBe(true)
    expect(can('member', { guest_invitation: ['send'] })).toBe(false)
    expect(can('member', { guest_invitation: ['resend'] })).toBe(false)
    expect(can('member', { guest_invitation: ['cancel'] })).toBe(true)
    expect(can('member', { invitation: ['create'] })).toBe(false)
    expect(can('member', { member: ['update'] })).toBe(false)
  })

  it('keeps viewer read-only and admin/owner invitation delivery-capable', () => {
    expect(can('viewer', { guest: ['create'] })).toBe(false)
    expect(can('viewer', { event: ['read'] })).toBe(true)
    expect(can('viewer', { wedding: ['update'] })).toBe(false)
    expect(can('member', { wedding: ['update'] })).toBe(true)
    expect(can('admin', { guest_invitation: ['send', 'resend', 'cancel'] })).toBe(true)
    expect(can('owner', { guest_invitation: ['send', 'resend', 'cancel'] })).toBe(true)
  })

  it('allows only owner and admin to manage organization members through Better Auth resources', () => {
    expect(can('owner', { invitation: ['create'], member: ['update', 'delete'] })).toBe(true)
    expect(can('admin', { invitation: ['create'], member: ['update', 'delete'] })).toBe(true)
    expect(can('member', { invitation: ['create'] })).toBe(false)
    expect(can('viewer', { member: ['delete'] })).toBe(false)
  })
})

describe('organization plugin wiring', () => {
  it('exports the full organization role matrix', () => {
    expect(Object.keys(organizationRoles)).toEqual(['owner', 'admin', 'member', 'viewer'])
    expect(organizationRoles.owner.statements.invitation).toEqual(['create', 'cancel'])
    expect(organizationRoles.owner.statements.member).toEqual(['create', 'update', 'delete'])
    expect(organizationRoles.member.statements.guest_invitation).toEqual([
      'read',
      'create',
      'cancel',
    ])
    expect(organizationRoles.member.statements.invitation).toBeUndefined()
  })

  it('maps Better Auth organization invitations to the dedicated OrganizationInvitation Prisma model', () => {
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

  it('keeps the Prisma Organization invitation relation compatible with Better Auth joins', () => {
    const prismaSchema = readFileSync('prisma/schema.prisma', 'utf8')

    expect(prismaSchema).toMatch(/\borganizationinvitations\s+OrganizationInvitation\[\]/)
  })

  it('uses the browser origin for auth client requests when available', () => {
    expect(resolveAuthClientBaseUrl('https://preview.example.com')).toBe(
      'https://preview.example.com'
    )
  })

  it('falls back to NEXT_PUBLIC_APP_URL for server-side auth client requests', () => {
    expect(resolveAuthClientBaseUrl()).toBe('http://localhost:3000')
  })

  it('trusts the current request origin for auth callbacks and form posts', () => {
    expect(resolveTrustedOrigins('http://localhost:3001/api/auth/sign-in/email')).toContain(
      'http://localhost:3001'
    )
    expect(
      resolveTrustedOrigins('https://preview.example.com/api/auth/sign-in/email')
    ).not.toContain('https://preview.example.com')
  })
})
