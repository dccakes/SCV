import { render, screen } from '@testing-library/react'

import SidebarPanel from '~/app/_components/old_dashboard/sidebar-panel'

describe('SidebarPanel', () => {
  it('should not show vendors in the dashboard sidebar panel', () => {
    const { container } = render(<SidebarPanel setShowWebsiteSettings={jest.fn()} />)

    expect(screen.queryByText('Vendors')).not.toBeInTheDocument()
    expect(container.querySelector("a[href='/vendors']")).toBeNull()
  })
})
