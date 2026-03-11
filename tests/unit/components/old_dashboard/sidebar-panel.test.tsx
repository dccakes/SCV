jest.mock('~/trpc/react', () => ({
  api: {
    selfFill: {
      getToken: {
        useQuery: jest.fn(() => ({ data: null })),
      },
    },
  },
}))

import { render, screen } from '@testing-library/react'

import SidebarPanel from '~/components/old_dashboard/sidebar-panel'

describe('SidebarPanel', () => {
  it('should not show vendors in the dashboard sidebar panel', () => {
    const { container } = render(<SidebarPanel setShowWebsiteSettings={jest.fn()} />)

    expect(screen.queryByText('Vendors')).not.toBeInTheDocument()
    expect(container.querySelector("a[href='/vendors']")).toBeNull()
  })
})
