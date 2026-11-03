/** @jest-environment node */

const mockConsume = jest.fn()
jest.mock('~/server/db', () => ({ db: {} }))
jest.mock('~/server/infrastructure/rate-limit/prisma-rate-limiter', () => ({
  PrismaRateLimiter: jest.fn().mockImplementation(() => ({ consume: mockConsume })),
}))
jest.mock('~/lib/observability/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}))

import {
  enforceRateLimit,
  RATE_LIMIT_POLICIES,
  rateLimitedResponse,
  rateLimitHeaders,
} from '~/server/infrastructure/rate-limit/enforce'

describe('enforceRateLimit', () => {
  it('namespaces the key by policy and rounds the wait up to whole seconds', async () => {
    mockConsume.mockResolvedValue({
      allowed: false,
      limit: 10,
      remaining: 0,
      resetMs: 1_200,
      retryAfterMs: 1_200,
    })

    const result = await enforceRateLimit('authSensitive', '/sign-up/email:1.1.1.1')

    expect(mockConsume).toHaveBeenCalledWith('authSensitive:/sign-up/email:1.1.1.1')
    expect(result).toEqual({
      allowed: false,
      retryAfterSeconds: 2,
      limit: 10,
      remaining: 0,
      resetSeconds: 2,
    })
  })

  it('fails open when the limiter hangs instead of blocking the request', async () => {
    jest.useFakeTimers()
    try {
      mockConsume.mockReturnValue(new Promise(() => {}))

      const pending = enforceRateLimit('publicTrpc', 'hang')
      await jest.advanceTimersByTimeAsync(2_000)
      const result = await pending

      expect(result.allowed).toBe(true)
      expect(rateLimitHeaders(result)).toEqual({})
    } finally {
      jest.useRealTimers()
    }
  })

  it('fails open when the limiter throws', async () => {
    mockConsume.mockRejectedValue(new Error('db down'))

    const result = await enforceRateLimit('publicTrpc', 'x')

    expect(result.allowed).toBe(true)
    expect(rateLimitHeaders(result)).toEqual({})
  })
})

describe('rateLimitHeaders', () => {
  const base = { limit: 10, remaining: 7, resetSeconds: 120, retryAfterSeconds: 0 }

  it('sends X-RateLimit-* without Retry-After while allowed', () => {
    expect(rateLimitHeaders({ ...base, allowed: true })).toEqual({
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '7',
      'X-RateLimit-Reset': '120',
    })
  })

  it('adds Retry-After when blocked', () => {
    expect(
      rateLimitHeaders({ ...base, allowed: false, remaining: 0, retryAfterSeconds: 30 })
    ).toMatchObject({ 'X-RateLimit-Remaining': '0', 'Retry-After': '30' })
  })
})

describe('rateLimitedResponse', () => {
  it('returns 429 with Retry-After and rate limit headers', async () => {
    const response = rateLimitedResponse({
      allowed: false,
      limit: 10,
      remaining: 0,
      resetSeconds: 30,
      retryAfterSeconds: 30,
    })

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('30')
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
    // Better Auth's client and UI read `message`; keep `error` for other callers.
    const body = (await response.json()) as { error: string; message: string }
    expect(body.message).toBe('Too many requests. Please try again later.')
    expect(body.error).toBe(body.message)
  })
})

describe('RATE_LIMIT_POLICIES', () => {
  it('pins the numbers the product and the tests rely on', () => {
    expect(RATE_LIMIT_POLICIES).toEqual({
      authSensitive: { limit: 10, windowMs: 600_000 },
      authDefault: { limit: 300, windowMs: 60_000 },
      publicTrpc: { limit: 120, windowMs: 60_000 },
      publicTrpcStrict: { limit: 10, windowMs: 60_000 },
      etta: { limit: 20, windowMs: 60_000 },
    })
  })
})

describe('enforceRateLimit result shaping', () => {
  it('never reports a retry of less than one second', async () => {
    mockConsume.mockResolvedValue({
      allowed: false,
      limit: 10,
      remaining: 0,
      resetMs: 1,
      retryAfterMs: 1,
    })

    expect((await enforceRateLimit('publicTrpc', 'k')).retryAfterSeconds).toBe(1)
  })

  it('does not fail open for a limiter that answers just inside the timeout', async () => {
    jest.useFakeTimers()
    try {
      mockConsume.mockReturnValue(
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                allowed: false,
                limit: 10,
                remaining: 0,
                resetMs: 5_000,
                retryAfterMs: 5_000,
              }),
            1_999
          )
        )
      )

      const pending = enforceRateLimit('publicTrpc', 'slow')
      await jest.advanceTimersByTimeAsync(1_999)

      expect(await pending).toMatchObject({ allowed: false, limit: 10 })
    } finally {
      jest.useRealTimers()
    }
  })
})
