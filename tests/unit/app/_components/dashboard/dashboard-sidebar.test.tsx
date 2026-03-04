import { render, screen, fireEvent } from '@testing-library/react'
import { usePathname } from 'next/navigation'

import DashboardSidebar from '~/app/_components/dashboard/dashboard-sidebar'

const mockUsePathname = usePathname as jest.Mock

describe('DashboardSidebar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard')
  })

  it('renders OSWP logo text', () => {
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

  it('renders mobile hamburger button', () => {
    render(<DashboardSidebar />)
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })

  it('shows couple names when coupleName prop is provided', () => {
    render(<DashboardSidebar coupleName="Holly & Diego" weddingDate="17 May 2027" />)
    expect(screen.getByText('Holly & Diego')).toBeInTheDocument()
    expect(screen.getByText(/17 May 2027/)).toBeInTheDocument()
  })

  it('opens mobile drawer when hamburger is clicked', () => {
    render(<DashboardSidebar />)
    const hamburger = screen.getByRole('button', { name: /open menu/i })
    fireEvent.click(hamburger)
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument()
  })
})
