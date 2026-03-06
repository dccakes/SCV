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

import { middleware } from '~/middleware'

const createRequest = (pathname: string, sessionToken?: string): NextRequest => {
  const url = `https://example.com${pathname}`
  const headers = new Headers()
  const cookies = {
    get: jest.fn((name: string) => {
      if (name !== 'better-auth.session_token' || !sessionToken) return undefined
      return { value: sessionToken }
    }),
  }

  return {
    url,
    headers,
    nextUrl: { pathname },
    cookies,
  } as unknown as NextRequest
}

describe('middleware', () => {
  beforeEach(() => {
    mockRedirect.mockClear()
    mockNext.mockClear()
  })

  it('redirects unauthenticated users away from /events', async () => {
    const response = await middleware(createRequest('/events'))

    expect(response.headers.get('location')).toBe('https://example.com/')
  })

  it('redirects unauthenticated users away from /vendors', async () => {
    const response = await middleware(createRequest('/vendors'))

    expect(response.headers.get('location')).toBe('https://example.com/')
  })

  it('allows authenticated users to access protected routes', async () => {
    const response = await middleware(createRequest('/events', 'session-token'))

    expect(response.headers.get('location')).toBeNull()
    expect(mockNext).toHaveBeenCalledTimes(1)
  })
})
