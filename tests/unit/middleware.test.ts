import type { NextRequest } from 'next/server'

const mockRedirect = jest.fn((url: URL) => ({
  headers: new Headers({ location: url.toString() }),
}))

const mockNext = jest.fn(() => ({
  headers: new Headers(),
}))

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL) => mockRedirect(url),
    next: () => mockNext(),
  },
}))

const mockGetSessionCookie = jest.fn()

jest.mock('better-auth/cookies', () => ({
  getSessionCookie: (...args: unknown[]) => mockGetSessionCookie(...args),
}))

import { middleware } from '~/middleware'

const createRequest = (pathname: string, sessionToken?: string): NextRequest => {
  const url = `https://example.com${pathname}`
  const headers = new Headers()
  if (sessionToken) {
    headers.set('cookie', `better-auth.session_token=${sessionToken}`)
  }

  return {
    url,
    headers,
    nextUrl: { pathname },
  } as unknown as NextRequest
}

describe('middleware', () => {
  beforeEach(() => {
    mockRedirect.mockClear()
    mockNext.mockClear()
    mockGetSessionCookie.mockReset()
  })

  it('redirects unauthenticated users from protected routes to /signin with callbackUrl', async () => {
    mockGetSessionCookie.mockReturnValue(null)
    const response = await middleware(createRequest('/events'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/signin?callbackUrl=%2Fevents'
    )
  })

  it('redirects unauthenticated users from any non-public route', async () => {
    mockGetSessionCookie.mockReturnValue(null)
    const response = await middleware(createRequest('/settings'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/signin?callbackUrl=%2Fsettings'
    )
  })

  it('allows unauthenticated users on public routes', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const rootResponse = await middleware(createRequest('/'))
    const signInResponse = await middleware(createRequest('/signin'))
    const authApiResponse = await middleware(createRequest('/api/auth/session'))

    expect(rootResponse.headers.get('location')).toBeNull()
    expect(signInResponse.headers.get('location')).toBeNull()
    expect(authApiResponse.headers.get('location')).toBeNull()
  })

  it('allows authenticated users to access protected routes', async () => {
    mockGetSessionCookie.mockReturnValue('session-token')
    const response = await middleware(createRequest('/events', 'session-token'))

    expect(response.headers.get('location')).toBeNull()
    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext).toHaveBeenCalledWith()
  })
})
