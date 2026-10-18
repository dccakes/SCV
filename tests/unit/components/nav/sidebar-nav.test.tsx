import { fireEvent, render, screen } from '@testing-library/react'
import { LayoutDashboard, Settings, Store } from 'lucide-react'

import SidebarNavContent, { type SidebarSection } from '~/components/nav/sidebar-nav-content'

const sections: readonly SidebarSection[] = [
  {
    title: 'Planning',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Vendors', href: '/vendors', icon: Store },
    ],
  },
  {
    title: 'Settings',
    items: [{ label: 'Settings', href: '/settings', icon: Settings }],
  },
]

describe('SidebarNavContent', () => {
  it('should render section titles and links when expanded', () => {
    render(
      <SidebarNavContent
        sections={sections}
        isCollapsed={false}
        isActive={(href) => href === '/dashboard'}
      />
    )

    expect(screen.getByText('Planning')).toBeInTheDocument()
    expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Vendors' })).not.toHaveAttribute('aria-current')
  })

  it('should hide section titles when collapsed and forward nav clicks', () => {
    const onNavClick = jest.fn()

    render(
      <SidebarNavContent
        sections={sections}
        isCollapsed
        isActive={() => false}
        onNavClick={onNavClick}
      />
    )

    expect(screen.queryByText('Planning')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }))
    expect(onNavClick).toHaveBeenCalledTimes(1)
  })
})
