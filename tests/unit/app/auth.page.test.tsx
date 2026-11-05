import { render, screen } from '@testing-library/react'

import AuthPage from '~/app/auth/[path]/page'

const mockRedirect = jest.fn()
jest.mock('next/navigation', () => ({
  // Real redirect() throws to stop rendering; the mock must too or the page keeps going.
  redirect: (url: string) => {
    mockRedirect(url)
    throw new Error('NEXT_REDIRECT')
  },
}))

jest.mock('~/env', () => ({
  env: {
    get ALLOW_SIGNUPS() {
      return process.env.ALLOW_SIGNUPS
    },
  },
}))

const mockAuthView = jest.fn(({ path }: { path: string }) => (
  <div data-testid='auth-view'>{path}</div>
))

jest.mock('@daveyplate/better-auth-ui', () => ({
  AuthView: ({ path }: { path: string }) => mockAuthView({ path }),
}))

describe('AuthPage', () => {
  const original = process.env.ALLOW_SIGNUPS

  beforeEach(() => {
    mockAuthView.mockClear()
    mockRedirect.mockClear()
    delete process.env.ALLOW_SIGNUPS
  })

  afterEach(() => {
    if (original === undefined) delete process.env.ALLOW_SIGNUPS
    else process.env.ALLOW_SIGNUPS = original
  })

  it('renders auth view and demo note for sign-in path', async () => {
    const page = await AuthPage({ params: Promise.resolve({ path: 'sign-in' }) })
    render(page)

    expect(mockAuthView).toHaveBeenCalledWith({ path: 'sign-in' })
    expect(screen.getByTestId('auth-view')).toBeInTheDocument()
    expect(screen.getByText('Demo Accounts')).toBeInTheDocument()
    expect(screen.getByText(/shrek@swamp\.wed/)).toBeInTheDocument()
    expect(screen.getByText(/fiona@swamp\.wed/)).toBeInTheDocument()
    expect(screen.getByText(/queen\.lillian@swamp\.wed/)).toBeInTheDocument()
    expect(screen.getByText(/password123/)).toBeInTheDocument()
  })

  it('does not render demo note for other auth paths', async () => {
    const page = await AuthPage({ params: Promise.resolve({ path: 'sign-up' }) })
    render(page)

    expect(mockAuthView).toHaveBeenCalledWith({ path: 'sign-up' })
    expect(screen.queryByText('Demo Accounts')).not.toBeInTheDocument()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  describe('when signups are disabled', () => {
    beforeEach(() => {
      process.env.ALLOW_SIGNUPS = 'false'
    })

    it('redirects sign-up to sign-in with a notice and never renders the sign-up form', async () => {
      await expect(AuthPage({ params: Promise.resolve({ path: 'sign-up' }) })).rejects.toThrow(
        'NEXT_REDIRECT'
      )

      expect(mockRedirect).toHaveBeenCalledWith('/auth/sign-in?notice=signups-closed')
      expect(mockAuthView).not.toHaveBeenCalled()
    })

    it('keeps where the visitor was going, such as an invitation', async () => {
      const redirectTo = '/auth/accept-invitation?invitationId=inv_123'

      await expect(
        AuthPage({
          params: Promise.resolve({ path: 'sign-up' }),
          searchParams: Promise.resolve({ redirectTo }),
        })
      ).rejects.toThrow('NEXT_REDIRECT')

      const url = new URL(mockRedirect.mock.calls[0]?.[0] as string, 'https://example.com')
      expect(url.pathname).toBe('/auth/sign-in')
      expect(url.searchParams.get('redirectTo')).toBe(redirectTo)
      expect(url.searchParams.get('notice')).toBe('signups-closed')
    })

    it('explains why on the sign-in page after that redirect', async () => {
      const page = await AuthPage({
        params: Promise.resolve({ path: 'sign-in' }),
        searchParams: Promise.resolve({ notice: 'signups-closed' }),
      })
      render(page)

      expect(screen.getByRole('status')).toHaveTextContent(/not being accepted right now/i)
    })

    it('does not touch sign-in or other auth paths', async () => {
      for (const path of ['sign-in', 'forgot-password']) {
        const page = await AuthPage({ params: Promise.resolve({ path }) })
        render(page)
      }

      expect(mockRedirect).not.toHaveBeenCalled()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })
})
