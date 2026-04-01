/**
 * @jest-environment node
 */

import { auth } from '~/lib/auth'
import { weddingService } from '~/server/domains/wedding'

jest.mock('~/lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}))

jest.mock('~/server/domains/wedding', () => ({
  weddingService: {
    getWeddingIdByUserId: jest.fn(),
  },
}))

const mockGetSession = auth.api.getSession as jest.Mock
const mockGetWeddingId = weddingService.getWeddingIdByUserId as jest.Mock

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
    mockGetWeddingId.mockResolvedValue('wedding-1')

    const result = await validateCoupleSession(new Headers())

    expect(result).toEqual({ weddingId: 'wedding-1', userId: 'user-1' })
    expect(mockGetWeddingId).toHaveBeenCalledWith('user-1')
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
    mockGetWeddingId.mockRejectedValue(new Error('No wedding found'))

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
    mockGetWeddingId.mockResolvedValue('wedding-1')

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
