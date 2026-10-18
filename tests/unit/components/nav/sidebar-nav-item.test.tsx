import { fireEvent, render, screen } from '@testing-library/react'

import { LayoutDashboard, Store } from 'lucide-react'

import SidebarNavItem from '~/components/nav/sidebar-nav-item'

describe('SidebarNavItem', () => {
  it('should render active styles when item is active', () => {
    render(
      <SidebarNavItem
        label='Dashboard'
        href='/dashboard'
        icon={LayoutDashboard}
        isActive
        isCollapsed={false}
      />
    )

    const link = screen.getByRole('link', { name: 'Dashboard' })
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(link).toHaveClass('bg-sidebar-accent', 'font-semibold')
  })

  it('should hide label text when collapsed and call click handler', () => {
    const onClick = jest.fn()

    render(
      <SidebarNavItem
        label='Vendors'
        href='/vendors'
        icon={Store}
        isActive={false}
        isCollapsed
        onClick={onClick}
      />
    )

    expect(screen.queryByText('Vendors')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Vendors' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
