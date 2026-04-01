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

import { OrganizationInvitationEmail } from '~/emails/organization-invitation-email'

const INVITE_URL = 'https://example.com/auth/accept-invitation?invitationId=inv_123'

describe('OrganizationInvitationEmail', () => {
  it('renders the accept invitation link with the provided url', () => {
    render(
      <OrganizationInvitationEmail
        inviteUrl={INVITE_URL}
        invitedByName='Shrek'
        organizationName='Shrek & Fiona'
        memberRole='editor'
      />
    )

    expect(screen.getByRole('link', { name: 'Accept Invitation' })).toHaveAttribute(
      'href',
      INVITE_URL
    )
  })

  it('includes organization and role details', () => {
    render(
      <OrganizationInvitationEmail
        inviteUrl={INVITE_URL}
        invitedByName='Fiona'
        organizationName='Shrek & Fiona'
        memberRole='viewer'
      />
    )

    expect(screen.getAllByText(/Shrek & Fiona/)).toHaveLength(2)
    expect(screen.getByText(/viewer/i)).toBeInTheDocument()
  })

  it('includes the inviter name when provided', () => {
    render(
      <OrganizationInvitationEmail
        inviteUrl={INVITE_URL}
        invitedByName='Fiona'
        organizationName='Shrek & Fiona'
        memberRole='editor'
      />
    )

    expect(screen.getByText(/Fiona invited you/i)).toBeInTheDocument()
  })
})
