import { fireEvent, render, screen } from '@testing-library/react'

import SidebarNavItem from '~/components/nav/sidebar-nav-item'

describe('SidebarNavItem', () => {
  it('should render active styles with cream copy on the dark sidebar', () => {
    render(
      <SidebarNavItem label='Dashboard' href='/dashboard' icon='◈' isActive isCollapsed={false} />
    )

    const link = screen.getByRole('link', { name: 'Dashboard' })
    expect(link).toHaveClass('border-primary')
    expect(link).toHaveClass('bg-primary/12')
    expect(link).toHaveClass('text-sidebar-cream')
  })

  it('should render inactive styles with cream hover states on the dark sidebar', () => {
    render(
      <SidebarNavItem
        label='Dashboard'
        href='/dashboard'
        icon='◈'
        isActive={false}
        isCollapsed={false}
      />
    )

    const link = screen.getByRole('link', { name: 'Dashboard' })
    expect(link).toHaveClass('text-sidebar-cream/55')
    expect(link).toHaveClass('hover:bg-white/[0.04]')
    expect(link).toHaveClass('hover:text-sidebar-cream/85')
  })

  it('should hide label text when collapsed and call click handler', () => {
    const onClick = jest.fn()

    render(
      <SidebarNavItem
        label='Vendors'
        href='/vendors'
        icon='◐'
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
