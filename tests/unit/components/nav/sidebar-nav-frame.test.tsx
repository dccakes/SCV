import { fireEvent, render, screen } from '@testing-library/react'

import SidebarNavFrame from '~/components/nav/sidebar-nav'
import { signOut } from '~/lib/auth-client'

jest.mock('~/lib/auth-client', () => ({
  signOut: jest.fn(),
}))

jest.mock('~/hooks/use-workspace', () => ({
  useWorkspace: jest.fn(() => ({
    workspace: {
      role: 'admin',
      capabilities: {
        canViewPlanning: true,
      },
      enabledAddOns: ['website_builder'],
    },
  })),
}))

const mockSignOut = signOut as jest.Mock
const { useWorkspace } = jest.requireMock('~/hooks/use-workspace') as {
  useWorkspace: jest.Mock
}

describe('SidebarNavFrame', () => {
  beforeEach(() => {
    mockSignOut.mockReset()
    useWorkspace.mockReset()
    useWorkspace.mockReturnValue({
      workspace: {
        role: 'admin',
        capabilities: {
          canViewPlanning: true,
        },
        enabledAddOns: ['website_builder'],
      },
    })
    localStorage.clear()
  })

  it('hides wedding chip when no wedding props are provided', () => {
    render(<SidebarNavFrame isOpen={false} setIsOpen={jest.fn()} />)

    expect(screen.queryByText('Holly & Diego')).not.toBeInTheDocument()
    expect(screen.queryByText('Oaxaca, Mexico')).not.toBeInTheDocument()
  })

  it('shows wedding details when props are provided', () => {
    render(
      <SidebarNavFrame
        isOpen={false}
        setIsOpen={jest.fn()}
        coupleName='Holly & Diego'
        weddingDate='17 May 2027'
        weddingLocation='Oaxaca, Mexico'
      />
    )

    expect(screen.getByText('Holly & Diego')).toBeInTheDocument()
    expect(screen.getByText('Oaxaca, Mexico')).toBeInTheDocument()
  })

  it('restores collapsed state from localStorage', () => {
    localStorage.setItem('sidebar-collapsed', 'true')

    render(<SidebarNavFrame isOpen={false} setIsOpen={jest.fn()} coupleName='Holly & Diego' />)

    expect(screen.queryByText('Holly & Diego')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument()
  })

  it('calls signOut when user clicks sign out', () => {
    render(<SidebarNavFrame isOpen={false} setIsOpen={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    expect(mockSignOut).toHaveBeenCalledWith(
      expect.objectContaining({
        fetchOptions: expect.objectContaining({
          onSuccess: expect.any(Function),
        }),
      })
    )
  })

  it('closes mobile drawer when close button is clicked', () => {
    const setIsOpen = jest.fn()

    render(<SidebarNavFrame isOpen setIsOpen={setIsOpen} />)

    fireEvent.click(screen.getByRole('button', { name: /close menu/i }))

    expect(setIsOpen).toHaveBeenCalledWith(false)
  })

  it('positions mobile close button away from header divider', () => {
    render(<SidebarNavFrame isOpen setIsOpen={jest.fn()} />)

    expect(screen.getByRole('button', { name: /close menu/i })).toHaveClass('top-2', 'h-9', 'w-9')
  })

  it('uses a scrollable nav region in mobile drawer', () => {
    render(<SidebarNavFrame isOpen setIsOpen={jest.fn()} />)

    const navElements = screen.getAllByRole('navigation')
    expect(navElements.length).toBeGreaterThan(0)
    expect(
      navElements.every((navElement) => navElement.classList.contains('overflow-y-auto'))
    ).toBe(true)
  })

  it('hides planning navigation when workspace cannot view planning', () => {
    useWorkspace.mockReturnValue({
      workspace: {
        role: 'viewer',
        capabilities: {
          canViewPlanning: false,
        },
        enabledAddOns: [],
      },
    })

    render(<SidebarNavFrame isOpen={false} setIsOpen={jest.fn()} />)

    expect(screen.queryByText('Planning')).not.toBeInTheDocument()
    expect(screen.queryByText('Guests')).not.toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
  })

  it('renders website navigation linking to the publish page', () => {
    render(<SidebarNavFrame isOpen={false} setIsOpen={jest.fn()} />)

    expect(screen.getByRole('link', { name: 'Wedding Website' })).toHaveAttribute(
      'href',
      '/website'
    )
  })

  it('hides Wedding Website nav item when website_builder add-on is not enabled', () => {
    useWorkspace.mockReturnValue({
      workspace: {
        role: 'owner',
        capabilities: {
          canViewPlanning: true,
        },
        enabledAddOns: [],
      },
    })

    render(<SidebarNavFrame isOpen={false} setIsOpen={jest.fn()} />)

    expect(screen.queryByRole('link', { name: 'Wedding Website' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
  })
})
