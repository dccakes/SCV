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

  it('redirects unauthenticated users from protected routes to /auth/sign-in with callbackUrl', async () => {
    mockGetSessionCookie.mockReturnValue(null)
    const response = await middleware(createRequest('/events'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fevents'
    )
  })

  it('redirects unauthenticated users from protected app routes', async () => {
    mockGetSessionCookie.mockReturnValue(null)
    const response = await middleware(createRequest('/settings'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fsettings'
    )
  })

  it('allows unauthenticated users on public routes', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const rootResponse = await middleware(createRequest('/'))
    const signInResponse = await middleware(createRequest('/auth/sign-in'))
    const joinResponse = await middleware(createRequest('/join/sample-token'))
    const websiteResponse = await middleware(createRequest('/shrek-and-fiona'))

    expect(rootResponse.headers.get('location')).toBeNull()
    expect(signInResponse.headers.get('location')).toBeNull()
    expect(joinResponse.headers.get('location')).toBeNull()
    expect(websiteResponse.headers.get('location')).toBeNull()
  })

  it('allows authenticated users to access protected routes', async () => {
    mockGetSessionCookie.mockReturnValue('session-token')
    const response = await middleware(createRequest('/events', 'session-token'))

    expect(response.headers.get('location')).toBeNull()
    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext).toHaveBeenCalledWith()
  })

  it('protects non-public routes by default', async () => {
    mockGetSessionCookie.mockReturnValue(null)
    const response = await middleware(createRequest('/design-system'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fdesign-system'
    )
  })
})
