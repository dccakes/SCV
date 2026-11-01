/** @jest-environment node */

const mockConsume = jest.fn()
jest.mock('~/server/db', () => ({ db: {} }))
jest.mock('~/server/infrastructure/rate-limit/prisma-rate-limiter', () => ({
  PrismaRateLimiter: jest.fn().mockImplementation(() => ({ consume: mockConsume })),
}))
jest.mock('~/lib/observability/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}))

import { enforceRateLimit, rateLimitedResponse } from '~/server/infrastructure/rate-limit/enforce'

describe('enforceRateLimit', () => {
  it('namespaces the key by policy and rounds the wait up to whole seconds', async () => {
    mockConsume.mockResolvedValue({ allowed: false, retryAfterMs: 1_200 })

    const result = await enforceRateLimit('authSensitive', '/sign-up/email:1.1.1.1')

    expect(mockConsume).toHaveBeenCalledWith('authSensitive:/sign-up/email:1.1.1.1')
    expect(result).toEqual({ allowed: false, retryAfterSeconds: 2 })
  })

  it('fails open when the limiter throws', async () => {
    mockConsume.mockRejectedValue(new Error('db down'))

    const result = await enforceRateLimit('publicTrpc', 'x')

    expect(result.allowed).toBe(true)
  })
})

describe('rateLimitedResponse', () => {
  it('returns 429 with a Retry-After header', async () => {
    const response = rateLimitedResponse(30)

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('30')
  })
})
