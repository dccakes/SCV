import { render, screen } from '@testing-library/react'

import GuestListPage from '~/app/(authenicated)/guest-list/page'

const mockGetRequiredDashboardOverview = jest.fn()
const mockGuestList = jest.fn((_props: { dashboardData: unknown }) => (
  <div data-testid='guest-list'>Guest list content</div>
))
const mockDashboardTopbar = jest.fn(
  (_props: { title?: string; showManagementActions?: boolean }) => (
    <header data-testid='dashboard-topbar'>Topbar</header>
  )
)

jest.mock('~/server/application/authenticated-route/authenticated-route-data', () => ({
  getRequiredDashboardOverview: () => mockGetRequiredDashboardOverview(),
}))

jest.mock('~/app/_components/guest-list', () => ({
  __esModule: true,
  default: ({ dashboardData }: { dashboardData: unknown }) => mockGuestList({ dashboardData }),
}))

jest.mock('~/components/dashboard/dashboard-topbar', () => ({
  __esModule: true,
  default: (props: { title?: string; showManagementActions?: boolean }) =>
    mockDashboardTopbar(props),
}))

describe('GuestListPage', () => {
  beforeEach(() => {
    mockGetRequiredDashboardOverview.mockReset()
    mockGuestList.mockClear()
    mockDashboardTopbar.mockClear()
  })

  it('fetches dashboard data server-side and passes it to guest list', async () => {
    const dashboardData = { events: [], households: [] }
    mockGetRequiredDashboardOverview.mockResolvedValue(dashboardData)

    const page = await GuestListPage()
    render(page)

    expect(mockGetRequiredDashboardOverview).toHaveBeenCalledTimes(1)
    expect(mockGuestList).toHaveBeenCalledWith({ dashboardData })
    expect(screen.getByTestId('guest-list')).toBeInTheDocument()
  })

  it('renders the guest-list topbar and dashboard-like scroll shell', async () => {
    mockGetRequiredDashboardOverview.mockResolvedValue({ events: [], households: [] })

    const page = await GuestListPage()
    const { container } = render(page)

    expect(mockDashboardTopbar).toHaveBeenCalledWith({
      title: 'Guest List',
      showManagementActions: false,
    })
    expect(screen.getByTestId('dashboard-topbar')).toBeInTheDocument()
    expect(
      container.querySelector('main.min-h-0.flex-1.overflow-y-auto.px-4.py-5.lg\\:px-6.lg\\:py-6')
    ).toBeTruthy()
  })
})
