import SignInPage from '~/app/auth/signin/page'

const mockRedirect = jest.fn()

jest.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}))

describe('SignInPage (/auth/signin alias)', () => {
  beforeEach(() => {
    mockRedirect.mockClear()
  })

  it('redirects to canonical sign-in route', async () => {
    await SignInPage()

    expect(mockRedirect).toHaveBeenCalledWith('/auth/sign-in')
  })

  it('preserves invite handoff redirectTo query params', async () => {
    await SignInPage({
      searchParams: Promise.resolve({
        redirectTo: '/auth/accept-invitation?invitationId=inv_test_123',
      }),
    })

    const redirectArg = mockRedirect.mock.calls[0]?.[0]
    const url = new URL(redirectArg, 'https://example.com')

    expect(url.pathname).toBe('/auth/sign-in')
    expect(url.searchParams.get('redirectTo')).toBe(
      '/auth/accept-invitation?invitationId=inv_test_123'
    )
  })

  it('forwards only allowlisted auth handoff params', async () => {
    await SignInPage({
      searchParams: Promise.resolve({
        callbackUrl: '/dashboard',
        redirectTo: '/auth/accept-invitation?invitationId=inv_test_123',
        unexpected: 'drop-me',
      }),
    })

    const redirectArg = mockRedirect.mock.calls[0]?.[0]
    const url = new URL(redirectArg, 'https://example.com')

    expect(url.pathname).toBe('/auth/sign-in')
    expect(url.searchParams.get('callbackUrl')).toBe('/dashboard')
    expect(url.searchParams.get('redirectTo')).toBe(
      '/auth/accept-invitation?invitationId=inv_test_123'
    )
    expect(url.searchParams.get('unexpected')).toBeNull()
  })
})
