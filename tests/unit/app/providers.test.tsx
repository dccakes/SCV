import { render, screen } from '@testing-library/react'

import { Providers } from '~/app/providers'

jest.mock('~/lib/auth-client', () => ({
  authClient: {},
  useSession: () => ({ data: null, isPending: false }),
}))

jest.mock('~/components/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockRefresh = jest.fn()
const mockAuthUIProvider = jest.fn(({ children }: { children?: React.ReactNode }) => (
  <div data-testid='auth-ui-provider'>{children}</div>
))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}))

jest.mock('@daveyplate/better-auth-ui', () => ({
  AuthUIProvider: (props: Record<string, unknown>) => mockAuthUIProvider(props),
}))

describe('Providers', () => {
  beforeEach(() => {
    mockAuthUIProvider.mockClear()
    mockPush.mockReset()
    mockReplace.mockReset()
    mockRefresh.mockReset()
  })

  it('passes custom organization role labels to AuthUIProvider', () => {
    render(
      <Providers>
        <div>Child content</div>
      </Providers>
    )

    expect(screen.getByText('Child content')).toBeInTheDocument()
    expect(mockAuthUIProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        emailOTP: true,
        emailVerification: { otp: true },
        organization: {
          customRoles: [
            { role: 'member', label: 'Member' },
            { role: 'viewer', label: 'Viewer' },
          ],
        },
      })
    )
  })

  it('shows sign up by default and when explicitly enabled', () => {
    render(
      <Providers>
        <div>Child content</div>
      </Providers>
    )
    expect(mockAuthUIProvider).toHaveBeenLastCalledWith(expect.objectContaining({ signUp: true }))

    render(
      <Providers signupsEnabled>
        <div>Child content</div>
      </Providers>
    )
    expect(mockAuthUIProvider).toHaveBeenLastCalledWith(expect.objectContaining({ signUp: true }))
  })

  it('hides sign up in the auth UI when signups are disabled', () => {
    render(
      <Providers signupsEnabled={false}>
        <div>Child content</div>
      </Providers>
    )

    expect(mockAuthUIProvider).toHaveBeenCalledWith(expect.objectContaining({ signUp: false }))
  })

  describe('navigate', () => {
    const renderAndGetNavigate = () => {
      render(
        <Providers>
          <div>Child content</div>
        </Providers>
      )
      const props = mockAuthUIProvider.mock.calls[0]?.[0] as unknown as {
        navigate: (path: string) => void
      }
      return props.navigate
    }

    afterEach(() => {
      window.history.pushState({}, '', '/')
    })

    it('carries redirectTo over to the email verification step', () => {
      window.history.pushState(
        {},
        '',
        '/auth/sign-up?redirectTo=%2Fauth%2Faccept-invitation%3FinvitationId%3Dinv_1'
      )

      renderAndGetNavigate()('/auth/email-verification?email=a%40b.com')

      expect(mockPush).toHaveBeenCalledWith(
        '/auth/email-verification?email=a%40b.com&redirectTo=%2Fauth%2Faccept-invitation%3FinvitationId%3Dinv_1'
      )
    })

    it('leaves the email verification path alone when there is no redirectTo', () => {
      window.history.pushState({}, '', '/auth/sign-up')

      renderAndGetNavigate()('/auth/email-verification?email=a%40b.com')

      expect(mockPush).toHaveBeenCalledWith('/auth/email-verification?email=a%40b.com')
    })

    it('does not touch other paths', () => {
      window.history.pushState({}, '', '/auth/sign-in?redirectTo=%2Fdashboard')

      renderAndGetNavigate()('/dashboard')

      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })
})
