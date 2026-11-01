/** @jest-environment node */

const mockPost = jest.fn()
const mockGet = jest.fn()
const mockEnforce = jest.fn()

jest.mock('~/lib/auth', () => ({ auth: { handler: jest.fn() } }))
jest.mock('~/server/db', () => ({ db: {} }))
jest.mock('better-auth/next-js', () => ({
  toNextJsHandler: () => ({
    GET: (req: Request) => mockGet(req),
    POST: (req: Request) => mockPost(req),
  }),
}))
// Real helpers (classification, headers, 429 response); only the DB-backed limiter is faked.
jest.mock('~/server/infrastructure/rate-limit', () => ({
  ...jest.requireActual('~/server/infrastructure/rate-limit'),
  enforceRateLimit: (...args: unknown[]) => mockEnforce(...args),
}))

import { GET, POST } from '~/app/api/auth/[...all]/route'
import type { EnforceResult } from '~/server/infrastructure/rate-limit'

const allowed: EnforceResult = {
  allowed: true,
  retryAfterSeconds: 0,
  limit: 10,
  remaining: 9,
  resetSeconds: 600,
}

const request = (path: string, headers: Record<string, string> = { 'x-real-ip': '9.9.9.9' }) =>
  new Request(`https://example.com/api/auth${path}`, { method: 'POST', headers })

describe('POST /api/auth/*', () => {
  beforeEach(() => {
    mockPost.mockResolvedValue(new Response('ok'))
    mockEnforce.mockResolvedValue(allowed)
  })

  it('applies the strict policy to sign-up', async () => {
    await POST(request('/sign-up/email'))

    expect(mockEnforce).toHaveBeenCalledWith('authSensitive', '/sign-up/email:9.9.9.9')
    expect(mockPost).toHaveBeenCalled()
  })

  it('pools ordinary endpoints into one default bucket per IP', async () => {
    await POST(request('/sign-out'))

    expect(mockEnforce).toHaveBeenCalledWith('authDefault', 'other:9.9.9.9')
  })

  it('never lets a made-up path create its own bucket', async () => {
    await POST(request(`/${'x'.repeat(5_000)}`))
    await POST(request(''))

    expect(mockEnforce).toHaveBeenNthCalledWith(1, 'authDefault', 'other:9.9.9.9')
    expect(mockEnforce).toHaveBeenNthCalledWith(2, 'authDefault', 'other:9.9.9.9')
  })

  it('uses the normalized IP so one IPv6 /64 shares a bucket', async () => {
    await POST(request('/sign-in/email', { 'x-real-ip': '2001:db8:1:2:aaaa:bbbb:cccc:dddd' }))

    expect(mockEnforce).toHaveBeenCalledWith('authSensitive', '/sign-in/email:2001:db8:1:2::/64')
  })

  it('returns a real 429 and never calls Better Auth when over the limit', async () => {
    mockEnforce.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 42,
      limit: 10,
      remaining: 0,
      resetSeconds: 42,
    })

    const response = await POST(request('/sign-in/email'))

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('42')
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(((await response.json()) as { message: string }).message).toMatch(/too many requests/i)
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('adds rate limit headers to allowed responses without changing the response', async () => {
    mockPost.mockResolvedValue(new Response('created', { status: 201, statusText: 'Created' }))

    const response = await POST(request('/sign-in/email'))

    expect(response.status).toBe(201)
    expect(response.statusText).toBe('Created')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('9')
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(await response.text()).toBe('created')
  })

  it('keeps every Set-Cookie header when it rebuilds the response (sign-in depends on it)', async () => {
    const upstream = new Response('ok')
    upstream.headers.append('set-cookie', 'session=abc; Path=/; HttpOnly')
    upstream.headers.append('set-cookie', 'session_data=def; Path=/; HttpOnly')
    mockPost.mockResolvedValue(upstream)

    const response = await POST(request('/sign-in/email'))

    expect(response.headers.getSetCookie()).toEqual([
      'session=abc; Path=/; HttpOnly',
      'session_data=def; Path=/; HttpOnly',
    ])
  })

  it('returns the handler response untouched when the limiter failed open', async () => {
    const upstream = new Response('ok')
    mockPost.mockResolvedValue(upstream)
    mockEnforce.mockResolvedValue({ ...allowed, limit: null })

    const response = await POST(request('/sign-in/email'))

    expect(response).toBe(upstream)
    expect(response.headers.get('X-RateLimit-Limit')).toBeNull()
  })

  it('skips limiting when no client IP is available', async () => {
    await POST(request('/sign-up/email', {}))

    expect(mockEnforce).not.toHaveBeenCalled()
    expect(mockPost).toHaveBeenCalled()
  })

  it('puts a malformed IP header in the shared invalid bucket instead of skipping limiting', async () => {
    await POST(request('/sign-up/email', { 'x-real-ip': 'garbage' }))

    expect(mockEnforce).toHaveBeenCalledWith('authSensitive', '/sign-up/email:invalid')
  })
})

describe('GET /api/auth/*', () => {
  it('is not rate limited', async () => {
    mockGet.mockResolvedValue(new Response('session'))

    await GET(
      new Request('https://example.com/api/auth/get-session', {
        headers: { 'x-real-ip': '9.9.9.9' },
      })
    )

    expect(mockEnforce).not.toHaveBeenCalled()
    expect(mockGet).toHaveBeenCalled()
  })
})
