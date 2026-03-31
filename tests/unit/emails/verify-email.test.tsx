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

import { VerifyEmail } from '~/emails/verify-email'

const VERIFY_URL = 'https://example.com/verify?token=xyz789'

describe('VerifyEmail', () => {
  it('renders a verify email link with the provided url', () => {
    render(<VerifyEmail url={VERIFY_URL} />)
    expect(screen.getByRole('link', { name: 'Verify Email' })).toHaveAttribute('href', VERIFY_URL)
  })

  it('includes personalised greeting when userName is provided', () => {
    render(<VerifyEmail url={VERIFY_URL} userName='Fiona' />)
    expect(screen.getByText(/Hi Fiona/)).toBeInTheDocument()
  })

  it('omits personalised greeting when userName is not provided', () => {
    render(<VerifyEmail url={VERIFY_URL} />)
    expect(screen.queryByText(/Hi /)).not.toBeInTheDocument()
  })

  it('includes safety disclaimer', () => {
    render(<VerifyEmail url={VERIFY_URL} />)
    expect(screen.getByText(/didn/)).toBeInTheDocument()
  })
})
