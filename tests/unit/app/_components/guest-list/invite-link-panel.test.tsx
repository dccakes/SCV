import { fireEvent, render, screen } from '@testing-library/react'

import { InviteLinkPanel } from '~/app/_components/guest-list/invite-link-panel'

jest.mock('~/app/_components/guest-list/self-invite-link-manager', () => ({
  SelfInviteLinkManager: () => <div data-testid='self-invite-link-manager' />,
}))

describe('InviteLinkPanel', () => {
  it('renders "Invite Link" button', () => {
    render(<InviteLinkPanel />)
    expect(screen.getByRole('button', { name: 'Invite Link' })).toBeInTheDocument()
  })

  it('panel is hidden initially', () => {
    render(<InviteLinkPanel />)
    expect(screen.queryByTestId('self-invite-link-manager')).not.toBeInTheDocument()
  })

  it('button has aria-expanded="false" initially', () => {
    render(<InviteLinkPanel />)
    expect(screen.getByRole('button', { name: 'Invite Link' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('clicking shows SelfInviteLinkManager', () => {
    render(<InviteLinkPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Invite Link' }))
    expect(screen.getByTestId('self-invite-link-manager')).toBeInTheDocument()
  })

  it('button aria-expanded="true" after clicking', () => {
    render(<InviteLinkPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Invite Link' }))
    expect(screen.getByRole('button', { name: 'Invite Link' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })

  it('clicking again hides the panel', () => {
    render(<InviteLinkPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Invite Link' }))
    expect(screen.getByTestId('self-invite-link-manager')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Invite Link' }))
    expect(screen.queryByTestId('self-invite-link-manager')).not.toBeInTheDocument()
  })
})
