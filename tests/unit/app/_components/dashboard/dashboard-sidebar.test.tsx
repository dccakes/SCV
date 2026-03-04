import { render, screen, act } from '@testing-library/react'
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

  it('opens mobile drawer when dashboard:open-sidebar event is dispatched', () => {
    render(<DashboardSidebar />)
    expect(screen.queryByRole('button', { name: /close menu/i })).not.toBeInTheDocument()
    act(() => {
      window.dispatchEvent(new Event('dashboard:open-sidebar'))
    })
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument()
  })
})
