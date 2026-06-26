import { fireEvent, render, screen } from '@testing-library/react'

import SidebarUserAvatarButton from '~/components/nav/sidebar-user-avatar-button'
import { useWorkspace } from '~/hooks/use-workspace'

jest.mock('~/hooks/use-workspace', () => ({
  useWorkspace: jest.fn(() => ({
    workspace: { role: 'admin' },
  })),
}))

const mockUseWorkspace = useWorkspace as jest.Mock

describe('SidebarUserAvatarButton', () => {
  beforeEach(() => {
    mockUseWorkspace.mockReset()
    mockUseWorkspace.mockReturnValue({
      workspace: { role: 'admin' },
    })
  })

  it('should render profile details and sign out label when expanded', () => {
    render(
      <SidebarUserAvatarButton
        firstName='Shrek'
        initials='SO'
        isCollapsed={false}
        onSignOut={jest.fn()}
      />
    )

    expect(screen.getByText('Shrek')).toBeInTheDocument()
    expect(screen.getByText('SO')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    expect(screen.getByText('Sign out')).toBeInTheDocument()
    expect(screen.getByText('Shrek')).toHaveClass('text-sidebar-cream/80')
    expect(screen.getByText('Admin')).toHaveClass('text-sidebar-cream/35')
    expect(screen.getByRole('button', { name: /sign out/i })).toHaveClass(
      'border-white/15',
      'text-sidebar-cream/55'
    )
  })

  it('should hide text labels when collapsed and still trigger sign out', () => {
    const onSignOut = jest.fn()

    render(<SidebarUserAvatarButton isCollapsed onSignOut={onSignOut} />)

    expect(screen.queryByText('User')).not.toBeInTheDocument()
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it('renders workspace role label from the active role', () => {
    mockUseWorkspace.mockReturnValue({
      workspace: { role: 'viewer' },
    })

    render(
      <SidebarUserAvatarButton
        firstName='Lillian'
        initials='QL'
        isCollapsed={false}
        onSignOut={jest.fn()}
      />
    )

    expect(screen.getByText('Viewer')).toBeInTheDocument()
  })
})
