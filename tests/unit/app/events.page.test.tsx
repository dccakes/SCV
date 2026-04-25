import { render, screen } from '@testing-library/react'

import EventsPage from '~/app/(authenicated)/events/page'

const mockGetRequiredWedding = jest.fn()
const mockGetEventsWithStats = jest.fn()
const mockGetPendingByDomain = jest.fn()
const mockEventsPageClient = jest.fn(
  ({
    initialEvents,
    initialSuggestions,
  }: {
    initialEvents: unknown[]
    initialSuggestions: unknown[]
  }) => (
    <div data-testid='events-page-client'>{initialEvents.length + initialSuggestions.length}</div>
  )
)
const mockDashboardTopbar = jest.fn(
  (_props: { title?: string; showManagementActions?: boolean }) => (
    <header data-testid='dashboard-topbar'>Topbar</header>
  )
)

jest.mock('~/server/application/authenticated-route/authenticated-route-data', () => ({
  getRequiredWedding: () => mockGetRequiredWedding(),
}))

jest.mock('~/trpc/server', () => ({
  api: {
    event: {
      getAllByUserIdWithStats: () => mockGetEventsWithStats(),
    },
    etta: {
      getPendingByDomain: (...args: unknown[]) => mockGetPendingByDomain(...args),
    },
  },
}))

jest.mock('~/app/(authenicated)/events/_components/events-page-client', () => ({
  EventsPageClient: (props: { initialEvents: unknown[]; initialSuggestions: unknown[] }) =>
    mockEventsPageClient(props),
}))

jest.mock('~/components/dashboard/dashboard-topbar', () => ({
  __esModule: true,
  default: (props: { title?: string; showManagementActions?: boolean }) =>
    mockDashboardTopbar(props),
}))

describe('EventsPage', () => {
  beforeEach(() => {
    mockGetRequiredWedding.mockReset()
    mockGetEventsWithStats.mockReset()
    mockGetPendingByDomain.mockReset()
    mockGetPendingByDomain.mockResolvedValue([])
    mockEventsPageClient.mockClear()
    mockDashboardTopbar.mockClear()
  })

  it('fetches events on server and passes initialEvents to client', async () => {
    mockGetRequiredWedding.mockResolvedValue(undefined)
    mockGetEventsWithStats.mockResolvedValue([{ id: 'evt-1' }])
    mockGetPendingByDomain.mockResolvedValue([{ id: 'suggestion-1' }])

    const page = await EventsPage({})
    render(page)

    expect(mockGetRequiredWedding).toHaveBeenCalledTimes(1)
    expect(mockGetEventsWithStats).toHaveBeenCalledTimes(1)
    expect(mockGetPendingByDomain).toHaveBeenCalledWith({ domain: 'events' })
    expect(mockEventsPageClient).toHaveBeenCalledWith({
      initialEvents: [{ id: 'evt-1' }],
      initialSuggestions: [{ id: 'suggestion-1' }],
    })
    expect(screen.getByTestId('events-page-client')).toBeInTheDocument()
  })

  it('passes an empty array when server query returns undefined', async () => {
    mockGetRequiredWedding.mockResolvedValue(undefined)
    mockGetEventsWithStats.mockResolvedValue(undefined)

    const page = await EventsPage({})
    render(page)

    expect(mockEventsPageClient).toHaveBeenCalledWith({
      initialEvents: [],
      initialSuggestions: [],
    })
  })

  it('renders dashboard topbar and authenticated page shell', async () => {
    mockGetRequiredWedding.mockResolvedValue(undefined)
    mockGetEventsWithStats.mockResolvedValue([])

    const page = await EventsPage({})
    const { container } = render(page)

    expect(mockDashboardTopbar).toHaveBeenCalledWith({
      title: 'Events',
      showManagementActions: false,
    })
    expect(screen.getByTestId('dashboard-topbar')).toBeInTheDocument()
    expect(
      container.querySelector('main.min-h-0.flex-1.overflow-y-auto.px-4.py-5.lg\\:px-6.lg\\:py-6')
    ).toBeTruthy()
  })
})
