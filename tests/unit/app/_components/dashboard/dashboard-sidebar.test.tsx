import { act, fireEvent, render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'

import DashboardSidebar from '~/app/_components/dashboard/dashboard-sidebar'

const mockUsePathname = usePathname as jest.Mock

// Helper to render with required controlled props
function renderSidebar(props: Partial<React.ComponentProps<typeof DashboardSidebar>> = {}) {
  return render(<DashboardSidebar isOpen={false} setIsOpen={jest.fn()} {...props} />)
}

describe('DashboardSidebar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard')
    localStorage.clear()
  })

  // ── Rendering ────────────────────────────────────────────────────────────────

  it('renders OSWP logo text when expanded', () => {
    renderSidebar()
    expect(screen.getByText('OSWP')).toBeInTheDocument()
  })

  it('renders all Planning nav links', () => {
    renderSidebar()
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /rsvps/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /guest list/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /vendors/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /website/i })).toBeInTheDocument()
  })

  it('marks the active nav item using the current pathname', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    renderSidebar()
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveClass('border-primary')
  })

  it('does not mark inactive nav item as active', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    renderSidebar()
    expect(screen.getByRole('link', { name: /vendors/i })).not.toHaveClass('border-primary')
  })

  it('highlights vendors link when pathname is /vendors', () => {
    mockUsePathname.mockReturnValue('/vendors')
    renderSidebar()
    expect(screen.getByRole('link', { name: /vendors/i })).toHaveClass('border-primary')
    expect(screen.getByRole('link', { name: /dashboard/i })).not.toHaveClass('border-primary')
  })

  it('shows couple names when coupleName prop is provided', () => {
    renderSidebar({ coupleName: 'Holly & Diego', weddingDate: '17 May 2027' })
    expect(screen.getByText('Holly & Diego')).toBeInTheDocument()
    expect(screen.getByText(/17 May 2027/)).toBeInTheDocument()
  })

  it('does not render wedding chip when no coupleName or weddingDate is provided', () => {
    renderSidebar()
    expect(screen.queryByText(/May/)).not.toBeInTheDocument()
  })

  // ── Collapse ──────────────────────────────────────────────────────────────────

  it('renders a collapse toggle button', () => {
    renderSidebar()
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument()
  })

  it('collapse toggle has aria-expanded=true when expanded', () => {
    renderSidebar()
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })

  it('hides nav labels when collapse toggle is clicked', () => {
    renderSidebar()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('shows expand toggle with aria-expanded=false after collapsing', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    const expandBtn = screen.getByRole('button', { name: /expand sidebar/i })
    expect(expandBtn).toBeInTheDocument()
    expect(expandBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('restores nav labels when expand toggle is clicked', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    fireEvent.click(screen.getByRole('button', { name: /expand sidebar/i }))
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('persists collapsed state to localStorage', () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    expect(localStorage.getItem('sidebar-collapsed')).toBe('true')
  })

  it('reads initial collapsed state from localStorage via useEffect', () => {
    localStorage.setItem('sidebar-collapsed', 'true')
    renderSidebar()
    act(() => {}) // flush effects
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument()
  })

  it('adds title tooltip to every nav link', () => {
    renderSidebar()
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('title')
    }
  })

  it('shows correct title on dashboard link', () => {
    renderSidebar()
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('title', 'Dashboard')
  })

  // ── Mobile drawer ─────────────────────────────────────────────────────────────

  it('renders mobile drawer close button when isOpen is true', () => {
    renderSidebar({ isOpen: true })
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument()
  })

  it('does not render mobile drawer when isOpen is false', () => {
    renderSidebar({ isOpen: false })
    expect(screen.queryByRole('button', { name: /close menu/i })).not.toBeInTheDocument()
  })

  it('calls setIsOpen(false) when close button is clicked', () => {
    const setIsOpen = jest.fn()
    renderSidebar({ isOpen: true, setIsOpen })
    fireEvent.click(screen.getByRole('button', { name: /close menu/i }))
    expect(setIsOpen).toHaveBeenCalledWith(false)
  })

  it('calls setIsOpen(false) when backdrop is clicked', () => {
    const setIsOpen = jest.fn()
    renderSidebar({ isOpen: true, setIsOpen })
    const dialog = screen.getByRole('dialog', { name: /navigation menu/i })
    const backdrop = dialog.querySelector('[aria-hidden="true"]')
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop!)
    expect(setIsOpen).toHaveBeenCalledWith(false)
  })

  it('mobile drawer has role=dialog and aria-modal=true', () => {
    renderSidebar({ isOpen: true })
    const dialog = screen.getByRole('dialog', { name: /navigation menu/i })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('mobile drawer renders nav links when open', () => {
    renderSidebar({ isOpen: true })
    expect(screen.getAllByRole('link', { name: /dashboard/i }).length).toBeGreaterThanOrEqual(1)
  })

  it('calls setIsOpen(false) when Escape key is pressed while drawer is open', () => {
    const setIsOpen = jest.fn()
    renderSidebar({ isOpen: true, setIsOpen })
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(setIsOpen).toHaveBeenCalledWith(false)
  })
})
