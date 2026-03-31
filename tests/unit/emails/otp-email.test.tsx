// @react-email/render v2 has a Node.js stream TDZ crash in Jest environments.
// Mock @react-email/components to avoid that dependency and test component logic
// using React Testing Library instead.
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
  Section: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Hr: () => <hr />,
  Font: () => null,
}))

import { render, screen } from '@testing-library/react'

import { OtpEmail } from '~/emails/otp-email'

describe('OtpEmail', () => {
  it('renders the OTP code', () => {
    render(<OtpEmail otp='847291' type='sign-in' />)
    expect(screen.getByText('847291')).toBeInTheDocument()
  })

  it('shows correct heading for sign-in type', () => {
    render(<OtpEmail otp='000000' type='sign-in' />)
    expect(screen.getByRole('heading', { name: 'Your sign-in code' })).toBeInTheDocument()
  })

  it('shows correct heading for email-verification type', () => {
    render(<OtpEmail otp='000000' type='email-verification' />)
    expect(screen.getByRole('heading', { name: 'Verify your email' })).toBeInTheDocument()
  })

  it('shows correct heading for forget-password type', () => {
    render(<OtpEmail otp='000000' type='forget-password' />)
    expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument()
  })

  it('includes expiry message in the body', () => {
    render(<OtpEmail otp='111111' type='sign-in' />)
    expect(screen.getByText(/10 minutes/)).toBeInTheDocument()
  })

  it('includes safety disclaimer', () => {
    render(<OtpEmail otp='111111' type='sign-in' />)
    expect(screen.getByText(/didn/)).toBeInTheDocument()
  })
})
