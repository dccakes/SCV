import { fireEvent, render, screen } from '@testing-library/react'

import DashboardTopbar from '~/components/dashboard/dashboard-topbar'
import { DASHBOARD_ADD_TASK_EVENT } from '~/components/dashboard/task-dialog-events'

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

  it('renders the Add task button', () => {
    render(<DashboardTopbar />)
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument()
  })

  it('dispatches the dashboard add-task event when the add-task button is clicked', () => {
    const eventHandler = jest.fn()
    window.addEventListener(DASHBOARD_ADD_TASK_EVENT, eventHandler)

    render(<DashboardTopbar />)
    fireEvent.click(screen.getByRole('button', { name: /add task/i }))

    expect(eventHandler).toHaveBeenCalledTimes(1)

    window.removeEventListener(DASHBOARD_ADD_TASK_EVENT, eventHandler)
  })

  it('uses an explicit add-task handler when provided', () => {
    const onAddTask = jest.fn()

    render(<DashboardTopbar onAddTask={onAddTask} />)
    fireEvent.click(screen.getByRole('button', { name: /add task/i }))

    expect(onAddTask).toHaveBeenCalledTimes(1)
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

  it('hides management actions when disabled', () => {
    render(<DashboardTopbar showManagementActions={false} />)
    expect(screen.queryByRole('button', { name: /add task/i })).not.toBeInTheDocument()
  })

  it('uses the warm translucent topbar styling', () => {
    render(<DashboardTopbar />)
    expect(screen.getByRole('banner')).toHaveClass('bg-card/70')
  })
})
