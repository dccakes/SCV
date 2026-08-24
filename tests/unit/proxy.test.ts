import type { NextRequest } from 'next/server'

const mockRedirect = jest.fn((url: URL, init?: number | ResponseInit) => ({
  headers: new Headers({ location: url.toString() }),
  status: typeof init === 'number' ? init : (init?.status ?? 307),
}))

const mockSetCookie = jest.fn()

const mockNext = jest.fn(() => ({
  headers: new Headers(),
  cookies: { set: mockSetCookie },
}))

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL, init?: number | ResponseInit) => mockRedirect(url, init),
    next: (...args: unknown[]) => mockNext(...args),
  },
}))

const mockGetSessionCookie = jest.fn()

jest.mock('better-auth/cookies', () => ({
  getSessionCookie: (...args: unknown[]) => mockGetSessionCookie(...args),
}))

import { proxy } from '~/proxy'

const createRequest = (
  pathname: string,
  sessionToken?: string,
  search = '',
  countryCode?: string,
  languageOverride?: string
): NextRequest => {
  const url = `https://example.com${pathname}${search}`
  const headers = new Headers()
  if (sessionToken) {
    headers.set('cookie', `better-auth.session_token=${sessionToken}`)
  }
  if (countryCode) {
    headers.set('x-vercel-ip-country', countryCode)
  }

  return {
    url,
    headers,
    nextUrl: { pathname, search },
    cookies: {
      get: jest.fn((name: string) =>
        name === 'lang-override' && languageOverride
          ? { name: 'lang-override', value: languageOverride }
          : undefined
      ),
    },
  } as unknown as NextRequest
}

describe('proxy', () => {
  beforeEach(() => {
    mockRedirect.mockClear()
    mockNext.mockClear()
    mockSetCookie.mockClear()
    mockGetSessionCookie.mockReset()
  })

  it('passes the geo-detected locale to Next.js and persists it for public pages', async () => {
    await proxy(createRequest('/w/shrek-and-fiona', undefined, '', 'MX'))

    const nextOptions = mockNext.mock.calls[0]?.[0] as
      | { request?: { headers?: Headers } }
      | undefined
    expect(nextOptions?.request?.headers?.get('X-Locale')).toBe('es')
    expect(mockSetCookie).toHaveBeenCalledWith('locale', 'es', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
  })

  it('prefers a valid language override over the geo-detected locale', async () => {
    mockGetSessionCookie.mockReturnValue('session-token')
    await proxy(createRequest('/events', 'session-token', '', 'MX', 'en'))

    const nextOptions = mockNext.mock.calls[0]?.[0] as
      | { request?: { headers?: Headers } }
      | undefined
    expect(nextOptions?.request?.headers?.get('X-Locale')).toBe('en')
    expect(mockSetCookie).toHaveBeenCalledWith('locale', 'en', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
  })

  it('redirects unauthenticated users from protected routes to /auth/sign-in with callbackUrl', async () => {
    mockGetSessionCookie.mockReturnValue(null)
    const response = await proxy(createRequest('/events'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fevents'
    )
  })

  it('redirects unauthenticated users from protected app routes', async () => {
    mockGetSessionCookie.mockReturnValue(null)
    const response = await proxy(createRequest('/settings'))

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
      proxy(createRequest('/')),
      proxy(createRequest('/blog')),
      proxy(createRequest('/blog/introducing-oswp')),
      proxy(createRequest('/pricing')),
      proxy(createRequest('/open-source')),
      proxy(createRequest('/auth/sign-in')),
      proxy(createRequest('/auth/accept-invitation', undefined, '?invitationId=inv_test_123')),
      proxy(createRequest('/join/sample-token')),
      proxy(createRequest('/w/shrek-and-fiona')),
      proxy(createRequest('/w/shrek-and-fiona/rsvp')),
      proxy(createRequest('/w/shrek-and-fiona/save-the-date')),
      proxy(createRequest('/w/shrek-and-fiona/save-the-date/sf-4f9k2c')),
      proxy(createRequest('/w/shrek-and-fiona/save-the-date/update')),
      proxy(createRequest('/api/auth/session')),
      proxy(createRequest('/api/blob/upload')),
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

  it('allows the guest-facing public tRPC procedures, including batched together', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    // The RSVP name search and submit are client-side public tRPC calls; gating
    // them would redirect to the sign-in HTML page, which the tRPC client can't
    // parse as JSON.
    const [searchResponse, submitResponse, batchedResponse] = await Promise.all([
      proxy(createRequest('/api/trpc/household.findBySearchPublic', undefined, '?batch=1')),
      proxy(createRequest('/api/trpc/website.submitPublicRsvpForm', undefined, '?batch=1')),
      proxy(
        createRequest(
          '/api/trpc/household.findBySearchPublic,website.submitPublicRsvpForm',
          undefined,
          '?batch=1'
        )
      ),
    ])

    expect(searchResponse.headers.get('location')).toBeNull()
    expect(submitResponse.headers.get('location')).toBeNull()
    expect(batchedResponse.headers.get('location')).toBeNull()
  })

  it('still gates non-public tRPC procedures behind the session', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    // A protected procedure — or a batch that mixes in one — is not exempt.
    const [protectedResponse, mixedBatchResponse] = await Promise.all([
      proxy(createRequest('/api/trpc/household.create', undefined, '?batch=1')),
      proxy(
        createRequest(
          '/api/trpc/household.findBySearchPublic,household.create',
          undefined,
          '?batch=1'
        )
      ),
    ])

    expect(protectedResponse.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fapi%2Ftrpc%2Fhousehold.create%3Fbatch%3D1'
    )
    expect(mixedBatchResponse.headers.get('location')).toContain('/auth/sign-in')
  })

  it('does not treat the legacy root-level invite path as public anymore', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const response = await proxy(createRequest('/shrek-and-fiona/invite/sf-4f9k2c'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fshrek-and-fiona%2Finvite%2Fsf-4f9k2c'
    )
  })

  it('redirects legacy root website URLs to /w/[slug]', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const response = await proxy(createRequest('/shrek-and-fiona'))

    expect(response.headers.get('location')).toBe('https://example.com/w/shrek-and-fiona')
    expect(response.status).toBe(302)
    expect(mockGetSessionCookie).not.toHaveBeenCalled()
  })

  it('does not redirect reserved root segments like /website', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const response = await proxy(createRequest('/website'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fwebsite'
    )
  })

  it('treats /checklist as a protected app route, not a website slug', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const response = await proxy(createRequest('/checklist'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fchecklist'
    )
  })

  it('treats /budget as a protected app route, not a website slug', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const response = await proxy(createRequest('/budget'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fbudget'
    )
  })

  it('allows authenticated users to access protected routes', async () => {
    mockGetSessionCookie.mockReturnValue('session-token')
    const response = await proxy(createRequest('/events', 'session-token'))

    expect(response.headers.get('location')).toBeNull()
    expect(mockNext).toHaveBeenCalledTimes(1)
    const nextOptions = mockNext.mock.calls[0]?.[0] as
      | { request?: { headers?: Headers } }
      | undefined
    expect(nextOptions?.request?.headers?.get('X-Locale')).toBe('en')
  })

  it('protects non-public routes by default', async () => {
    mockGetSessionCookie.mockReturnValue(null)
    const response = await proxy(createRequest('/design-system'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fdesign-system'
    )
  })

  it('preserves query params in the callbackUrl for protected routes', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const response = await proxy(createRequest('/events', undefined, '?tab=upcoming'))

    expect(response.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fevents%3Ftab%3Dupcoming'
    )
  })

  it('does not treat prefix lookalikes as public', async () => {
    mockGetSessionCookie.mockReturnValue(null)

    const authLikeResponse = await proxy(createRequest('/authentic'))
    const joinLikeResponse = await proxy(createRequest('/joinery'))

    expect(authLikeResponse.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fauthentic'
    )
    expect(joinLikeResponse.headers.get('location')).toBe(
      'https://example.com/auth/sign-in?callbackUrl=%2Fjoinery'
    )
  })
})
