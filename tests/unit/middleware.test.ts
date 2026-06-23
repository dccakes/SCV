import type { NextRequest } from 'next/server'

const mockRedirect = jest.fn((url: URL) => ({
  headers: new Headers({ location: url.toString() }),
}))

const mockNextResponse = {
  headers: new Headers(),
  cookies: { set: jest.fn() },
}

const mockNext = jest.fn(() => mockNextResponse)

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL) => mockRedirect(url),
    next: (...args: unknown[]) => mockNext(...args),
  },
}))

const mockGetSessionCookie = jest.fn()

jest.mock('better-auth/cookies', () => ({
  getSessionCookie: (...args: unknown[]) => mockGetSessionCookie(...args),
}))

import { middleware } from '~/middleware'

const createRequest = (pathname: string, sessionToken?: string, search = ''): NextRequest => {
  const url = `https://example.com${pathname}${search}`
  const headers = new Headers()
  if (sessionToken) {
    headers.set('cookie', `better-auth.session_token=${sessionToken}`)
  }

  return {
    url,
    headers,
    nextUrl: { pathname, search },
    cookies: {
      get: jest.fn().mockReturnValue(undefined),
    },
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

    const [
      rootResponse,
      blogIndexResponse,
      blogSlugResponse,
      pricingResponse,
      openSourceResponse,
      signInResponse,
      acceptInvitationResponse,
      joinResponse,
      websiteResponse,
      websiteRsvpResponse,
      websiteInviteResponse,
      websiteInviteTokenResponse,
      authApiResponse,
      blobUploadResponse,
    ] = await Promise.all([
      middleware(createRequest('/')),
      middleware(createRequest('/blog')),
      middleware(createRequest('/blog/introducing-oswp')),
      middleware(createRequest('/pricing')),
      middleware(createRequest('/open-source')),
      middleware(createRequest('/auth/sign-in')),
      middleware(createRequest('/auth/accept-invitation', undefined, '?invitationId=inv_test_123')),
      middleware(createRequest('/join/sample-token')),
      middleware(createRequest('/shrek-and-fiona')),
      middleware(createRequest('/shrek-and-fiona/rsvp')),
      middleware(createRequest('/shrek-and-fiona/invite')),
      middleware(createRequest('/shrek-and-fiona/invite/sample-token')),
      middleware(createRequest('/api/auth/session')),
      middleware(createRequest('/api/blob/upload')),
    ])

    expect(rootResponse.headers.get('location')).toBeNull()
    expect(blogIndexResponse.headers.get('location')).toBeNull()
    expect(blogSlugResponse.headers.get('location')).toBeNull()
    expect(pricingResponse.headers.get('location')).toBeNull()
    expect(openSourceResponse.headers.get('location')).toBeNull()
    expect(signInResponse.headers.get('location')).toBeNull()
    expect(acceptInvitationResponse.headers.get('location')).toBeNull()
    expect(joinResponse.headers.get('location')).toBeNull()
    expect(websiteResponse.headers.get('location')).toBeNull()
    expect(websiteRsvpResponse.headers.get('location')).toBeNull()
    expect(websiteInviteResponse.headers.get('location')).toBeNull()
    expect(websiteInviteTokenResponse.headers.get('location')).toBeNull()
    expect(authApiResponse.headers.get('location')).toBeNull()
    expect(blobUploadResponse.headers.get('location')).toBeNull()
    expect(mockGetSessionCookie).not.toHaveBeenCalled()
  })

  it('allows authenticated users to access protected routes', async () => {
    mockGetSessionCookie.mockReturnValue('session-token')
    const response = await middleware(createRequest('/events', 'session-token'))

    expect(response.headers.get('location')).toBeNull()
    expect(mockNext).toHaveBeenCalledTimes(1)
  })

  it('protects non-public routes by default', async () => {
    mockGetSessionCookie.mockReturnValue(null)
    const response = await middleware(createRequest('/design-system'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fdesign-system'
    )
  })

  it('preserves query params in the callbackUrl for protected routes', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const response = await middleware(createRequest('/events', undefined, '?tab=upcoming'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fevents%3Ftab%3Dupcoming'
    )
  })

  it('does not treat prefix lookalikes as public', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const authLikeResponse = await middleware(createRequest('/authentic'))
    const joinLikeResponse = await middleware(createRequest('/joinery'))

    expect(authLikeResponse.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fauthentic'
    )
    expect(joinLikeResponse.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fjoinery'
    )
  })
})
