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
  it('returns 429 with Retry-After and rate limit headers', () => {
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
  })
})
