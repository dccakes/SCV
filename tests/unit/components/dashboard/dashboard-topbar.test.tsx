import { fireEvent, render, screen } from '@testing-library/react'

import DashboardTopbar from '~/components/dashboard/dashboard-topbar'

jest.mock('~/components/theme-toggle', () => ({
  ThemeToggle: () => <button type='button'>Toggle theme</button>,
}))

const mockOpenSidebar = jest.fn()

jest.mock('~/components/layout/authenticated-app-shell', () => ({
  useAuthenticatedSidebar: () => ({
    openSidebar: mockOpenSidebar,
  }),
}))

describe('DashboardTopbar', () => {
  const originalDateTimeFormat = Intl.DateTimeFormat

  beforeEach(() => {
    mockOpenSidebar.mockReset()
  })

  afterEach(() => {
    Intl.DateTimeFormat = originalDateTimeFormat
  })

  it('renders the page title "Dashboard"', () => {
    render(<DashboardTopbar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders a custom title when provided', () => {
    render(<DashboardTopbar title='Guest List' />)
    expect(screen.getByText('Guest List')).toBeInTheDocument()
  })

  it('opens sidebar when hamburger button is clicked', () => {
    render(<DashboardTopbar />)
    fireEvent.click(screen.getByRole('button', { name: /open sidebar/i }))
    expect(mockOpenSidebar).toHaveBeenCalledTimes(1)
  })

  it('uses explicit menu handler when provided', () => {
    const onMenuToggle = jest.fn()

    render(<DashboardTopbar onMenuToggle={onMenuToggle} />)
    fireEvent.click(screen.getByRole('button', { name: /open sidebar/i }))

    expect(onMenuToggle).toHaveBeenCalledTimes(1)
    expect(mockOpenSidebar).not.toHaveBeenCalled()
  })

  it('renders today string using browser locale formatter', () => {
    const format = jest.fn().mockReturnValue('Friday, 6 March 2026')
    Intl.DateTimeFormat = jest
      .fn()
      .mockImplementation(() => ({ format })) as unknown as typeof Intl.DateTimeFormat

    render(<DashboardTopbar />)

    expect(screen.getByText('Friday, 6 March 2026')).toBeInTheDocument()
    expect(format).toHaveBeenCalledWith(expect.any(Date))
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
