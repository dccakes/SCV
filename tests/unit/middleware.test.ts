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

  it('redirects unauthenticated users away from /events', async () => {
    mockGetSessionCookie.mockReturnValue(null)
    const response = await middleware(createRequest('/events'))

    expect(response.headers.get('location')).toBe('https://example.com/')
  })

  it('redirects unauthenticated users away from /vendors', async () => {
    mockGetSessionCookie.mockReturnValue(null)
    const response = await middleware(createRequest('/vendors'))

    expect(response.headers.get('location')).toBe('https://example.com/')
  })

  it('allows authenticated users to access protected routes', async () => {
    mockGetSessionCookie.mockReturnValue('session-token')
    const response = await middleware(createRequest('/events', 'session-token'))

    expect(response.headers.get('location')).toBeNull()
    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext).toHaveBeenCalledWith()
  })
})
