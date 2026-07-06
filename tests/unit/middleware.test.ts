import type { NextRequest } from 'next/server'

const mockRedirect = jest.fn((url: URL, init?: number | ResponseInit) => ({
  headers: new Headers({ location: url.toString() }),
  status: typeof init === 'number' ? init : (init?.status ?? 307),
}))

const mockNext = jest.fn(() => ({
  headers: new Headers(),
}))

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL, init?: number | ResponseInit) => mockRedirect(url, init),
    next: () => mockNext(),
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
      websiteSaveTheDateResponse,
      websiteSaveTheDateCodeResponse,
      websiteSaveTheDateUpdateResponse,
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
      middleware(createRequest('/w/shrek-and-fiona')),
      middleware(createRequest('/w/shrek-and-fiona/rsvp')),
      middleware(createRequest('/w/shrek-and-fiona/save-the-date')),
      middleware(createRequest('/w/shrek-and-fiona/save-the-date/sf-4f9k2c')),
      middleware(createRequest('/w/shrek-and-fiona/save-the-date/update')),
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
    expect(websiteSaveTheDateResponse.headers.get('location')).toBeNull()
    expect(websiteSaveTheDateCodeResponse.headers.get('location')).toBeNull()
    expect(websiteSaveTheDateUpdateResponse.headers.get('location')).toBeNull()
    expect(authApiResponse.headers.get('location')).toBeNull()
    expect(blobUploadResponse.headers.get('location')).toBeNull()
    expect(mockGetSessionCookie).not.toHaveBeenCalled()
  })

  it('does not treat the legacy root-level invite path as public anymore', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const response = await middleware(createRequest('/shrek-and-fiona/invite/sf-4f9k2c'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fshrek-and-fiona%2Finvite%2Fsf-4f9k2c'
    )
  })

  it('redirects legacy root website URLs to /w/[slug]', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const response = await middleware(createRequest('/shrek-and-fiona'))

    expect(response.headers.get('location')).toBe('https://example.com/w/shrek-and-fiona')
    expect(response.status).toBe(302)
    expect(mockGetSessionCookie).not.toHaveBeenCalled()
  })

  it('does not redirect reserved root segments like /website', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const response = await middleware(createRequest('/website'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fwebsite'
    )
  })

  it('treats /checklist as a protected app route, not a website slug', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const response = await middleware(createRequest('/checklist'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fchecklist'
    )
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
