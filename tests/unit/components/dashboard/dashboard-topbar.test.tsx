import { fireEvent, render, screen } from '@testing-library/react'

import DashboardTopbar from '~/components/dashboard/dashboard-topbar'

jest.mock('~/app/_components/theme-toggle', () => ({
  ThemeToggle: () => <button type='button'>Toggle theme</button>,
}))

const mockOpenSidebar = jest.fn()

jest.mock('~/components/layout/authenticated-app-shell', () => ({
  useAuthenticatedSidebar: () => ({
    openSidebar: mockOpenSidebar,
  }),
}))

describe('DashboardTopbar', () => {
  beforeEach(() => {
    mockOpenSidebar.mockReset()
  })

  it('renders the page title "Dashboard"', () => {
    render(<DashboardTopbar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders the Add task button', () => {
    render(<DashboardTopbar />)
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument()
  })

  it('opens sidebar when hamburger button is clicked', () => {
    render(<DashboardTopbar />)
    fireEvent.click(screen.getByRole('button', { name: /open sidebar/i }))
    expect(mockOpenSidebar).toHaveBeenCalledTimes(1)
  })

  it('renders Export guest list button', () => {
    render(<DashboardTopbar />)
    expect(screen.getByRole('button', { name: /export guest list/i })).toBeInTheDocument()
  })

  it('renders Send update button', () => {
    render(<DashboardTopbar />)
    expect(screen.getByRole('button', { name: /send update/i })).toBeInTheDocument()
  })

  it('renders a theme toggle button', () => {
    render(<DashboardTopbar />)
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })

  it('uses the warm translucent topbar styling', () => {
    render(<DashboardTopbar />)
    expect(screen.getByRole('banner')).toHaveClass('bg-card/70')
  })
})
