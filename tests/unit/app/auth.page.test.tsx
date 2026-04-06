import { render, screen } from '@testing-library/react'

import AuthPage from '~/app/auth/[path]/page'

const mockAuthView = jest.fn(({ path }: { path: string }) => (
  <div data-testid='auth-view'>{path}</div>
))

jest.mock('@daveyplate/better-auth-ui', () => ({
  AuthView: ({ path }: { path: string }) => mockAuthView({ path }),
}))

describe('AuthPage', () => {
  beforeEach(() => {
    mockAuthView.mockClear()
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
  })
})
