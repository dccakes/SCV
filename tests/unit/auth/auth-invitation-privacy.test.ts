jest.mock('~/lib/auth-permissions', () => require('~/lib/__mocks__/auth-permissions'))

// 'better-auth/api' resolves to tests/unit/stubs/better-auth-api.ts (see jest.config.ts).
import { APIError, getSessionFromCtx } from 'better-auth/api'

const mockGetSessionFromCtx = getSessionFromCtx as unknown as jest.Mock

import {
  canViewOrganizationInvitations,
  invitationPrivacyPlugin,
} from '~/lib/auth-invitation-privacy'

type Handler = (ctx: unknown) => Promise<unknown>
const beforeHook = invitationPrivacyPlugin.hooks.before[0]
const afterHook = invitationPrivacyPlugin.hooks.after[0]
const runBefore = beforeHook.handler as unknown as Handler
const runAfter = afterHook.handler as unknown as Handler

const session = (activeOrganizationId: string | null = 'org-1') => ({
  user: { id: 'user-1' },
  session: { activeOrganizationId },
})

describe('canViewOrganizationInvitations', () => {
  it.each([
    ['owner', true],
    ['admin', true],
    ['member', false],
    ['viewer', false],
    ['unknown-role', false],
    ['', false],
    [null, false],
    [undefined, false],
    ['viewer,admin', true],
    ['viewer, member', false],
  ])('role %p -> %p', (role, expected) => {
    expect(canViewOrganizationInvitations(role as string | null | undefined)).toBe(expected)
  })
})

describe('hook matchers', () => {
  it('targets only the two invitation-bearing organization endpoints', () => {
    expect(beforeHook.matcher({ path: '/organization/list-invitations' } as never)).toBe(true)
    expect(beforeHook.matcher({ path: '/organization/list-members' } as never)).toBe(false)
    expect(afterHook.matcher({ path: '/organization/get-full-organization' } as never)).toBe(true)
    expect(afterHook.matcher({ path: '/organization/list-invitations' } as never)).toBe(false)
  })
})

describe('list-invitations before hook', () => {
  const buildCtx = (memberRole: string | null, query?: Record<string, string>) => ({
    query,
    context: {
      adapter: {
        findOne: jest.fn().mockResolvedValue(memberRole === null ? null : { role: memberRole }),
      },
    },
  })

  beforeEach(() => mockGetSessionFromCtx.mockReset())

  it.each(['viewer', 'member'])('rejects a %s with FORBIDDEN', async (role) => {
    mockGetSessionFromCtx.mockResolvedValue(session())
    await expect(runBefore(buildCtx(role))).rejects.toMatchObject({ status: 'FORBIDDEN' })
  })

  it.each(['owner', 'admin'])('lets %s through', async (role) => {
    mockGetSessionFromCtx.mockResolvedValue(session())
    await expect(runBefore(buildCtx(role))).resolves.toBeUndefined()
  })

  it('leaves non-members to the endpoint (it already rejects them)', async () => {
    mockGetSessionFromCtx.mockResolvedValue(session())
    await expect(runBefore(buildCtx(null))).resolves.toBeUndefined()
  })

  it('leaves unauthenticated callers to the endpoint', async () => {
    mockGetSessionFromCtx.mockResolvedValue(null)
    await expect(runBefore(buildCtx('viewer'))).resolves.toBeUndefined()
  })

  it('checks the organization named in the query over the active one', async () => {
    mockGetSessionFromCtx.mockResolvedValue(session('org-active'))
    const ctx = buildCtx('viewer', { organizationId: 'org-queried' })

    await expect(runBefore(ctx)).rejects.toMatchObject({ status: 'FORBIDDEN' })
    expect(ctx.context.adapter.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.arrayContaining([{ field: 'organizationId', value: 'org-queried' }]),
      })
    )
  })

  it('does nothing when no organization can be resolved', async () => {
    mockGetSessionFromCtx.mockResolvedValue(session(null))
    const ctx = buildCtx('viewer')

    await expect(runBefore(ctx)).resolves.toBeUndefined()
    expect(ctx.context.adapter.findOne).not.toHaveBeenCalled()
  })
})

describe('get-full-organization after hook', () => {
  const invitations = [{ id: 'inv-1', email: 'secret@example.com', role: 'member' }]
  const buildCtx = (returned: unknown) => ({
    context: { returned },
    json: jest.fn((body: unknown) => ({ response: body })),
  })
  const fullOrg = (callerRole: string) => ({
    id: 'org-1',
    members: [
      { userId: 'user-1', role: callerRole },
      { userId: 'user-2', role: 'owner' },
    ],
    invitations,
  })

  beforeEach(() => {
    mockGetSessionFromCtx.mockReset()
    mockGetSessionFromCtx.mockResolvedValue(session())
  })

  it.each(['viewer', 'member'])('empties invitations for a %s but keeps members', async (role) => {
    const body = fullOrg(role)
    const ctx = buildCtx(body)

    await runAfter(ctx)

    expect(ctx.json).toHaveBeenCalledWith({ ...body, invitations: [] })
  })

  it.each(['owner', 'admin'])('leaves the response alone for %s', async (role) => {
    const ctx = buildCtx(fullOrg(role))

    await expect(runAfter(ctx)).resolves.toBeUndefined()
    expect(ctx.json).not.toHaveBeenCalled()
  })

  it('fails closed when the caller cannot be matched to a member', async () => {
    mockGetSessionFromCtx.mockResolvedValue({ ...session(), user: { id: 'someone-else' } })
    const ctx = buildCtx(fullOrg('owner'))

    await runAfter(ctx)

    expect(ctx.json).toHaveBeenCalledWith(expect.objectContaining({ invitations: [] }))
  })

  it('fails closed when there is no session', async () => {
    mockGetSessionFromCtx.mockResolvedValue(null)
    const ctx = buildCtx(fullOrg('owner'))

    await runAfter(ctx)

    expect(ctx.json).toHaveBeenCalledWith(expect.objectContaining({ invitations: [] }))
  })

  it.each([
    ['null', null],
    ['an error', new APIError('NOT_FOUND')],
    ['a body without an invitations array', { id: 'org-1', members: [] }],
  ])('passes %s through untouched', async (_label, returned) => {
    const ctx = buildCtx(returned)

    await expect(runAfter(ctx)).resolves.toBeUndefined()
    expect(ctx.json).not.toHaveBeenCalled()
  })
})
