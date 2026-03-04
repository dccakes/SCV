import { fireEvent, render, screen } from '@testing-library/react'

import SidebarUserAvatarButton from '~/components/nav/sidebar-user-avatar-button'

describe('SidebarUserAvatarButton', () => {
  it('should render profile details and sign out label when expanded', () => {
    render(<SidebarUserAvatarButton isCollapsed={false} onSignOut={jest.fn()} />)

    expect(screen.getByText('Couple')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    expect(screen.getByText('Sign out')).toBeInTheDocument()
  })

  it('should hide text labels when collapsed and still trigger sign out', () => {
    const onSignOut = jest.fn()

    render(<SidebarUserAvatarButton isCollapsed onSignOut={onSignOut} />)

    expect(screen.queryByText('Couple')).not.toBeInTheDocument()
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(onSignOut).toHaveBeenCalledTimes(1)
  })
})
