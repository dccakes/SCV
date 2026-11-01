/** @jest-environment node */

const mockPost = jest.fn()
const mockEnforce = jest.fn()

jest.mock('~/lib/auth', () => ({ auth: { handler: jest.fn() } }))
jest.mock('better-auth/next-js', () => ({
  toNextJsHandler: () => ({ GET: jest.fn(), POST: (req: Request) => mockPost(req) }),
}))
jest.mock('~/server/infrastructure/rate-limit', () => ({
  ...jest.requireActual('~/server/infrastructure/rate-limit/client-ip'),
  enforceRateLimit: (...args: unknown[]) => mockEnforce(...args),
  rateLimitedResponse: (result: { retryAfterSeconds: number }) =>
    new Response(null, {
      status: 429,
      headers: { 'Retry-After': String(result.retryAfterSeconds) },
    }),
  rateLimitHeaders: (result: { limit: number | null; remaining: number }) =>
    result.limit === null ? {} : { 'X-RateLimit-Remaining': String(result.remaining) },
}))

import { POST } from '~/app/api/auth/[...all]/route'

const request = (path: string, headers: Record<string, string> = { 'x-real-ip': '9.9.9.9' }) =>
  new Request(`https://example.com/api/auth${path}`, { method: 'POST', headers })

describe('POST /api/auth/*', () => {
  beforeEach(() => {
    mockPost.mockResolvedValue(new Response('ok'))
    mockEnforce.mockResolvedValue({ allowed: true, retryAfterSeconds: 0, limit: 10, remaining: 9 })
  })

  it('applies the strict policy to sign-up', async () => {
    await POST(request('/sign-up/email'))

    expect(mockEnforce).toHaveBeenCalledWith('authSensitive', '/sign-up/email:9.9.9.9')
    expect(mockPost).toHaveBeenCalled()
  })

  it('adds rate limit headers to allowed responses', async () => {
    const response = await POST(request('/sign-in/email'))

    expect(response.headers.get('X-RateLimit-Remaining')).toBe('9')
    expect(await response.text()).toBe('ok')
  })

  it('applies the default policy to other endpoints', async () => {
    await POST(request('/sign-out'))

    expect(mockEnforce).toHaveBeenCalledWith('authDefault', '/sign-out:9.9.9.9')
  })

  it('returns 429 and does not call Better Auth when over the limit', async () => {
    mockEnforce.mockResolvedValue({ allowed: false, retryAfterSeconds: 42 })

    const response = await POST(request('/sign-in/email'))

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('42')
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('skips limiting when no client IP is available', async () => {
    await POST(request('/sign-up/email', {}))

    expect(mockEnforce).not.toHaveBeenCalled()
    expect(mockPost).toHaveBeenCalled()
  })
})
