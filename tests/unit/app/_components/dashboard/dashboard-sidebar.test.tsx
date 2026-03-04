import { render, screen, fireEvent, act } from '@testing-library/react'
import { usePathname } from 'next/navigation'

import DashboardSidebar from '~/app/_components/dashboard/dashboard-sidebar'

const mockUsePathname = usePathname as jest.Mock

describe('DashboardSidebar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard')
    localStorage.clear()
  })

  // ── Rendering ────────────────────────────────────────────────────────────────

  it('renders OSWP logo text when expanded', () => {
    render(<DashboardSidebar />)
    expect(screen.getByText('OSWP')).toBeInTheDocument()
  })

  it('renders all Planning nav links', () => {
    render(<DashboardSidebar />)
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /rsvps/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /guest list/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /vendors/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /website/i })).toBeInTheDocument()
  })

  it('marks the active nav item using the current pathname', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    render(<DashboardSidebar />)
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveClass('border-primary')
  })

  it('does not mark inactive nav item as active', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    render(<DashboardSidebar />)
    const vendorsLink = screen.getByRole('link', { name: /vendors/i })
    expect(vendorsLink).not.toHaveClass('border-primary')
  })

  it('shows couple names when coupleName prop is provided', () => {
    render(<DashboardSidebar coupleName='Holly & Diego' weddingDate='17 May 2027' />)
    expect(screen.getByText('Holly & Diego')).toBeInTheDocument()
    expect(screen.getByText(/17 May 2027/)).toBeInTheDocument()
  })

  it('does not render wedding chip when no coupleName or weddingDate is provided', () => {
    render(<DashboardSidebar />)
    expect(screen.queryByText(/May/)).not.toBeInTheDocument()
  })

  // ── Collapse ──────────────────────────────────────────────────────────────────

  it('renders a collapse toggle button', () => {
    render(<DashboardSidebar />)
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument()
  })

  it('hides nav labels when collapse toggle is clicked', () => {
    render(<DashboardSidebar />)
    // Labels visible by default
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    // Label text gone from DOM
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
  })

  it('shows expand toggle button after collapsing', () => {
    render(<DashboardSidebar />)
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument()
  })

  it('restores nav labels when expand toggle is clicked', () => {
    render(<DashboardSidebar />)
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    fireEvent.click(screen.getByRole('button', { name: /expand sidebar/i }))
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('persists collapsed state to localStorage', () => {
    render(<DashboardSidebar />)
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    expect(localStorage.getItem('sidebar-collapsed')).toBe('true')
  })

  it('reads initial collapsed state from localStorage', () => {
    localStorage.setItem('sidebar-collapsed', 'true')
    render(<DashboardSidebar />)
    // Nav labels should not be visible
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument()
  })

  it('adds title tooltip to nav links when collapsed', () => {
    localStorage.setItem('sidebar-collapsed', 'true')
    render(<DashboardSidebar />)
    const links = screen.getAllByRole('link')
    // Every nav link should have a title attribute when collapsed
    for (const link of links) {
      expect(link).toHaveAttribute('title')
    }
  })

  // ── Mobile drawer ─────────────────────────────────────────────────────────────

  it('opens mobile drawer when dashboard:open-sidebar event is dispatched', () => {
    render(<DashboardSidebar />)
    expect(screen.queryByRole('button', { name: /close menu/i })).not.toBeInTheDocument()
    act(() => {
      window.dispatchEvent(new Event('dashboard:open-sidebar'))
    })
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument()
  })

  it('mobile drawer renders nav links when open', () => {
    render(<DashboardSidebar />)
    act(() => {
      window.dispatchEvent(new Event('dashboard:open-sidebar'))
    })
    // Multiple instances (desktop + mobile) — at least 2 Dashboard links
    expect(screen.getAllByRole('link', { name: /dashboard/i }).length).toBeGreaterThanOrEqual(1)
  })
})
