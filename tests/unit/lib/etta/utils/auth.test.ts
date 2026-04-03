/**
 * @jest-environment node
 */

import { auth } from '~/lib/auth'
import { resolveWorkspaceScope } from '~/server/application/workspace/workspace-scope'

jest.mock('~/lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}))

jest.mock('~/server/application/workspace/workspace-scope', () => ({
  resolveWorkspaceScope: jest.fn(),
}))

jest.mock('~/server/db', () => ({
  db: {
    $queryRaw: jest.fn().mockResolvedValue([]),
  },
}))

const mockGetSession = auth.api.getSession as jest.Mock
const mockResolveWorkspaceScope = resolveWorkspaceScope as jest.Mock

// Set JWT_SECRET before importing auth utils (module reads it at call time)
process.env.JWT_SECRET = 'test-secret-key-for-testing-minimum-length'

import {
  issueGuestToken,
  resolveEttaAuth,
  validateCoupleSession,
  validateGuestToken,
} from '~/lib/etta/utils/auth'

// ── validateCoupleSession ───────────────────────────────────────────────────

describe('validateCoupleSession', () => {
  it('returns weddingId and userId for a valid session', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: { id: 'session-1' },
    })
    mockResolveWorkspaceScope.mockResolvedValue({
      activeOrganization: { organizationId: 'org-1', role: 'owner' },
      activeWeddingId: 'wedding-1',
    })

    const result = await validateCoupleSession(new Headers())

    expect(result.weddingId).toBe('wedding-1')
    expect(result.userId).toBe('user-1')
    expect(result.authz).toBeDefined()
    expect(result.authz.userId).toBe('user-1')
  })

  it('throws when no session exists', async () => {
    mockGetSession.mockResolvedValue(null)

    await expect(validateCoupleSession(new Headers())).rejects.toThrow()
  })

  it('throws when there is no active wedding in workspace scope', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: { id: 'session-1' },
    })
    mockResolveWorkspaceScope.mockResolvedValue({
      activeOrganization: { organizationId: 'org-1', role: 'member' },
      activeWeddingId: null,
    })

    await expect(validateCoupleSession(new Headers())).rejects.toThrow()
  })
})

// ── issueGuestToken / validateGuestToken ────────────────────────────────────

describe('issueGuestToken', () => {
  it('returns a valid JWT string', async () => {
    const token = await issueGuestToken('wedding-1', 42)

    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })
})

describe('validateGuestToken', () => {
  it('decodes a token issued by issueGuestToken', async () => {
    const token = await issueGuestToken('wedding-1', 42)
    const result = await validateGuestToken(token)

    expect(result).toEqual({ weddingId: 'wedding-1', guestId: 42 })
  })

  it('throws on an invalid token', async () => {
    await expect(validateGuestToken('invalid.token.here')).rejects.toThrow()
  })
})

// ── resolveEttaAuth ─────────────────────────────────────────────────────────

describe('resolveEttaAuth', () => {
  it('resolves couple auth when no guestToken', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: { id: 'session-1' },
    })
    mockResolveWorkspaceScope.mockResolvedValue({
      activeOrganization: { organizationId: 'org-1', role: 'owner' },
      activeWeddingId: 'wedding-1',
    })

    const req = new Request('http://localhost/api/etta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hello' }],
      }),
    })

    const result = await resolveEttaAuth(req)

    expect(result.actor).toBe('couple')
    expect(result.weddingId).toBe('wedding-1')
  })

  it('converts UI messages into model messages', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: { id: 'session-1' },
    })
    mockResolveWorkspaceScope.mockResolvedValue({
      activeOrganization: { organizationId: 'org-1', role: 'owner' },
      activeWeddingId: 'wedding-1',
    })

    const req = new Request('http://localhost/api/etta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'hello from ui message' }],
          },
        ],
      }),
    })

    const result = await resolveEttaAuth(req)

    expect(result.messages).toEqual([
      {
        role: 'user',
        content: [{ type: 'text', text: 'hello from ui message' }],
      },
    ])
  })

  it('falls through to couple auth when persona=concierge but no guestToken', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u1' },
      session: { id: 'session-1' },
    })
    mockResolveWorkspaceScope.mockResolvedValue({
      activeOrganization: { organizationId: 'org-1', role: 'owner' },
      activeWeddingId: 'w1',
    })

    const req = new Request('http://localhost/api/etta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hello' }],
        persona: 'concierge',
      }),
    })

    const result = await resolveEttaAuth(req)

    expect(result.actor).toBe('couple')
  })

  it('resolves guest auth when persona=concierge with guestToken', async () => {
    const token = await issueGuestToken('wedding-2', 99)

    const req = new Request('http://localhost/api/etta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hello' }],
        persona: 'concierge',
        guestToken: token,
      }),
    })

    const result = await resolveEttaAuth(req)

    expect(result.actor).toBe('guest')
    expect(result.weddingId).toBe('wedding-2')
    expect(result.guestId).toBe(99)
  })
})
