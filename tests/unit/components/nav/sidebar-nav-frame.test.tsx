import { fireEvent, render, screen } from '@testing-library/react'

import SidebarNavFrame from '~/components/nav/sidebar-nav'
import { signOut } from '~/lib/auth-client'

jest.mock('~/lib/auth-client', () => ({
  signOut: jest.fn(),
}))

const mockSignOut = signOut as jest.Mock

describe('SidebarNavFrame', () => {
  beforeEach(() => {
    mockSignOut.mockReset()
    localStorage.clear()
  })

  it('shows fallback wedding details when no wedding props are provided', () => {
    render(<SidebarNavFrame isOpen={false} setIsOpen={jest.fn()} />)

    expect(screen.getByText('Holly & Diego')).toBeInTheDocument()
    expect(screen.getByText('17 May 2027')).toBeInTheDocument()
    expect(screen.getByText('Oaxaca, Mexico')).toBeInTheDocument()
  })

  it('restores collapsed state from localStorage', () => {
    localStorage.setItem('sidebar-collapsed', 'true')

    render(<SidebarNavFrame isOpen={false} setIsOpen={jest.fn()} />)

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
})
