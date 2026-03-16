jest.mock('lib/auth', () => ({
  auth: {
    api: {
      hasPermission: jest.fn(),
      listOrganizations: jest.fn(),
    },
  },
}))

import { auth } from 'lib/auth'
import { resolveActiveOrganization } from 'server/authz/active-organization'
import { requirePermission } from 'server/authz/permission-checker'

const mockHasPermission = auth.api.hasPermission as jest.Mock
const mockListOrganizations = auth.api.listOrganizations as jest.Mock

const createCtx = (overrides?: { sessionActiveOrganizationId?: string | null }) => ({
  headers: new Headers(),
  userId: 'user-1',
  sessionActiveOrganizationId: overrides?.sessionActiveOrganizationId ?? null,
})

describe('authz permission checker', () => {
  beforeEach(() => {
    mockHasPermission.mockReset()
    mockListOrganizations.mockReset()
  })

  it('resolves active organization from session first', async () => {
    mockListOrganizations.mockResolvedValue([
      {
        id: 'org-2',
        role: 'admin',
        createdAt: '2025-01-03T00:00:00.000Z',
      },
      {
        id: 'org-1',
        role: 'owner',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ])

    const result = await resolveActiveOrganization(
      createCtx({ sessionActiveOrganizationId: 'org-2' }),
      {
        organizationId: 'org-2',
      }
    )

    expect(result.organizationId).toBe('org-2')
    expect(result.role).toBe('admin')
  })

  it('throws PRECONDITION_FAILED when session and explicit organization differ', async () => {
    mockListOrganizations.mockResolvedValue([
      {
        id: 'org-2',
        role: 'admin',
        createdAt: '2025-01-03T00:00:00.000Z',
      },
      {
        id: 'org-1',
        role: 'owner',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ])

    await expect(
      resolveActiveOrganization(createCtx({ sessionActiveOrganizationId: 'org-2' }), {
        organizationId: 'org-1',
      })
    ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' })
  })

  it('resolves explicit organization when user is a member', async () => {
    mockListOrganizations.mockResolvedValue([
      {
        id: 'org-1',
        role: 'owner',
        createdAt: '2025-01-03T00:00:00.000Z',
      },
      {
        id: 'org-2',
        role: 'editor',
        createdAt: '2025-01-02T00:00:00.000Z',
      },
    ])

    const result = await resolveActiveOrganization(createCtx(), {
      organizationId: 'org-2',
    })

    expect(result.organizationId).toBe('org-2')
    expect(result.role).toBe('editor')
  })

  it('falls back to earliest membership deterministically', async () => {
    mockListOrganizations.mockResolvedValue([
      {
        id: 'org-b',
        role: 'viewer',
        createdAt: '2025-01-05T00:00:00.000Z',
      },
      {
        id: 'org-a',
        role: 'admin',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ])

    const result = await resolveActiveOrganization(createCtx())

    expect(result.organizationId).toBe('org-a')
    expect(result.role).toBe('admin')
  })

  it('throws PRECONDITION_FAILED when explicit organization is not a membership', async () => {
    mockListOrganizations.mockResolvedValue([
      {
        id: 'org-1',
        role: 'owner',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ])

    await expect(
      resolveActiveOrganization(createCtx(), {
        organizationId: 'org-2',
      })
    ).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
    })
  })

  it('throws PRECONDITION_FAILED when no memberships exist', async () => {
    mockListOrganizations.mockResolvedValue([])

    await expect(resolveActiveOrganization(createCtx())).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
    })
  })

  it('throws PRECONDITION_FAILED when organization plugin list API is missing', async () => {
    const originalListOrganizations = auth.api.listOrganizations
    Reflect.set(auth.api as object, 'listOrganizations', undefined)

    await expect(resolveActiveOrganization(createCtx())).rejects.toMatchObject({
      code: 'PRECONDITION_FAILED',
    })

    Reflect.set(auth.api as object, 'listOrganizations', originalListOrganizations)
  })

  it('throws FORBIDDEN when permission check fails', async () => {
    mockListOrganizations.mockResolvedValue([
      {
        id: 'org-1',
        role: 'owner',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ])
    mockHasPermission.mockResolvedValue({ success: false })

    await expect(
      requirePermission(createCtx(), {
        invitation: ['send'],
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('returns active organization when permission check passes', async () => {
    mockListOrganizations.mockResolvedValue([
      {
        id: 'org-1',
        role: 'owner',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ])
    mockHasPermission.mockResolvedValue({ success: true })

    const ctx = createCtx()
    const permissions = { invitation: ['send'] as const }

    const result = await requirePermission(ctx, permissions)

    expect(result.organizationId).toBe('org-1')
    expect(mockHasPermission).toHaveBeenCalledWith({
      headers: ctx.headers,
      body: {
        organizationId: 'org-1',
        permissions,
      },
    })
  })

  it('throws PRECONDITION_FAILED when permission API is missing', async () => {
    mockListOrganizations.mockResolvedValue([
      {
        id: 'org-1',
        role: 'owner',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ])

    const originalHasPermission = auth.api.hasPermission
    Reflect.set(auth.api as object, 'hasPermission', undefined)

    await expect(
      requirePermission(createCtx(), {
        invitation: ['send'],
      })
    ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' })

    Reflect.set(auth.api as object, 'hasPermission', originalHasPermission)
  })

  it('throws PRECONDITION_FAILED when session active organization is invalid', async () => {
    mockListOrganizations.mockResolvedValue([
      {
        id: 'org-1',
        role: 'owner',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    ])

    await expect(
      resolveActiveOrganization(createCtx({ sessionActiveOrganizationId: 'org-2' }))
    ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' })
  })
})
