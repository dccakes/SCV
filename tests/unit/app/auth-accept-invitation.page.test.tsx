import { render, screen } from '@testing-library/react'

import AcceptInvitationPage from '~/app/auth/accept-invitation/page'

const mockAcceptInvitationCard = jest.fn(() => (
  <div data-testid='accept-invitation-card'>Accept invitation</div>
))

jest.mock('@daveyplate/better-auth-ui', () => ({
  AcceptInvitationCard: (props: Record<string, unknown>) => mockAcceptInvitationCard(props),
}))

describe('AcceptInvitationPage', () => {
  beforeEach(() => {
    mockAcceptInvitationCard.mockClear()
  })

  it('renders the Better Auth accept invitation card in the app shell', () => {
    render(<AcceptInvitationPage />)

    expect(screen.getByTestId('accept-invitation-card')).toBeInTheDocument()
    expect(screen.getByText('Join this wedding workspace')).toBeInTheDocument()
    expect(mockAcceptInvitationCard).toHaveBeenCalled()
  })
})
