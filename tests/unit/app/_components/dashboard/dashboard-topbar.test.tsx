import { fireEvent, render, screen } from '@testing-library/react'

import DashboardTopbar from '~/app/_components/dashboard/dashboard-topbar'

describe('DashboardTopbar', () => {
  it('renders the page title "Dashboard"', () => {
    render(<DashboardTopbar onMenuToggle={jest.fn()} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders the Add task button', () => {
    render(<DashboardTopbar onMenuToggle={jest.fn()} />)
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument()
  })

  it('calls onMenuToggle when hamburger button is clicked', () => {
    const mockToggle = jest.fn()
    render(<DashboardTopbar onMenuToggle={mockToggle} />)
    fireEvent.click(screen.getByRole('button', { name: /open sidebar/i }))
    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  it('renders Export guest list button', () => {
    render(<DashboardTopbar onMenuToggle={jest.fn()} />)
    expect(screen.getByRole('button', { name: /export guest list/i })).toBeInTheDocument()
  })

  it('renders Send update button', () => {
    render(<DashboardTopbar onMenuToggle={jest.fn()} />)
    expect(screen.getByRole('button', { name: /send update/i })).toBeInTheDocument()
  })

  it('renders a theme toggle button', () => {
    render(<DashboardTopbar onMenuToggle={jest.fn()} />)
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })
})
