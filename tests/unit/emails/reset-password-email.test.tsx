jest.mock('@react-email/components', () => ({
  Html: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Head: () => null,
  Body: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Preview: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='preview'>{children}</div>
  ),
  Container: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Heading: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
  Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  Button: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

import { render, screen } from '@testing-library/react'

import { ResetPasswordEmail } from '~/emails/reset-password-email'

const RESET_URL = 'https://example.com/reset?token=abc123'

describe('ResetPasswordEmail', () => {
  it('renders a reset password link with the provided url', () => {
    render(<ResetPasswordEmail url={RESET_URL} />)
    expect(screen.getByRole('link', { name: 'Reset Password' })).toHaveAttribute('href', RESET_URL)
  })

  it('includes personalised greeting when userName is provided', () => {
    render(<ResetPasswordEmail url={RESET_URL} userName='Shrek' />)
    expect(screen.getByText(/Hi Shrek/)).toBeInTheDocument()
  })

  it('omits personalised greeting when userName is not provided', () => {
    render(<ResetPasswordEmail url={RESET_URL} />)
    expect(screen.queryByText(/Hi /)).not.toBeInTheDocument()
  })

  it('includes safety disclaimer', () => {
    render(<ResetPasswordEmail url={RESET_URL} />)
    expect(screen.getByText(/didn/)).toBeInTheDocument()
  })
})
