/**
 * @jest-environment node
 */

import { auth } from '~/lib/auth'
import { db } from '~/server/db'

jest.mock('~/lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}))

jest.mock('~/server/db', () => ({
  db: {
    userWedding: {
      findFirst: jest.fn(),
    },
  },
}))

const mockGetSession = auth.api.getSession as jest.Mock
const mockFindFirst = db.userWedding.findFirst as jest.Mock

// Set JWT_SECRET before importing auth utils (module reads it at call time)
process.env.JWT_SECRET = 'test-secret-key-for-testing-minimum-length'

import {
  validateCoupleSession,
  issueGuestToken,
  validateGuestToken,
  resolveEttaAuth,
} from '~/lib/etta/utils/auth'

// ── validateCoupleSession ───────────────────────────────────────────────────

describe('validateCoupleSession', () => {
  it('returns weddingId and userId for a valid session', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: { id: 'session-1' },
    })
    mockFindFirst.mockResolvedValue({ weddingId: 'wedding-1' })

    const result = await validateCoupleSession(new Headers())

    expect(result).toEqual({ weddingId: 'wedding-1', userId: 'user-1' })
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    })
  })

  it('throws when no session exists', async () => {
    mockGetSession.mockResolvedValue(null)

    await expect(validateCoupleSession(new Headers())).rejects.toThrow()
  })

  it('throws when the user has no wedding', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: { id: 'session-1' },
    })
    mockFindFirst.mockResolvedValue(null)

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
    await expect(validateGuestToken('not.a.jwt')).rejects.toThrow()
  })
})

// ── resolveEttaAuth ─────────────────────────────────────────────────────────

describe('resolveEttaAuth', () => {
  function makeRequest(body: Record<string, unknown>, headers?: Headers) {
    return new Request('http://localhost/api/etta', {
      method: 'POST',
      headers: headers ?? new Headers({ 'content-type': 'application/json' }),
      body: JSON.stringify(body),
    })
  }

  it('resolves couple auth when no guestToken is present', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1' },
      session: { id: 'session-1' },
    })
    mockFindFirst.mockResolvedValue({ weddingId: 'wedding-1' })

    const messages = [{ role: 'user', content: 'Hello' }]
    const req = makeRequest({ messages })
    const result = await resolveEttaAuth(req)

    expect(result).toEqual({
      actor: 'couple',
      weddingId: 'wedding-1',
      messages,
    })
  })

  it('resolves guest auth when persona=concierge with guestToken', async () => {
    const guestToken = await issueGuestToken('wedding-2', 7)
    const messages = [{ role: 'user', content: 'Hi' }]
    const req = makeRequest({
      messages,
      persona: 'concierge',
      guestToken,
    })

    const result = await resolveEttaAuth(req)

    expect(result).toEqual({
      actor: 'guest',
      weddingId: 'wedding-2',
      guestId: 7,
      messages,
    })
  })
})
