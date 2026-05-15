import { render, screen } from '@testing-library/react'

import ChecklistPage from '~/app/(authenicated)/checklist/page'

const mockGetRequiredWedding = jest.fn()
const mockGetTasks = jest.fn()
const mockGetMilestones = jest.fn()
const mockGetEvents = jest.fn()
const mockChecklistPageClient = jest.fn(
  ({
    initialTasks,
    initialMilestones,
    initialEvents,
  }: {
    initialTasks: unknown[]
    initialMilestones: unknown[]
    initialEvents: unknown[]
  }) => (
    <div data-testid='checklist-page-client'>
      {initialTasks.length}:{initialMilestones.length}:{initialEvents.length}
    </div>
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
    task: {
      list: (input: unknown) => mockGetTasks(input),
    },
    milestone: {
      getAll: (input: unknown) => mockGetMilestones(input),
    },
    event: {
      getAllByUserIdWithStats: () => mockGetEvents(),
    },
  },
}))

jest.mock('~/app/(authenicated)/checklist/_components/checklist-page-client', () => ({
  ChecklistPageClient: (props: {
    initialTasks: unknown[]
    initialMilestones: unknown[]
    initialEvents: unknown[]
  }) => mockChecklistPageClient(props),
}))

jest.mock('~/components/dashboard/dashboard-topbar', () => ({
  __esModule: true,
  default: (props: { title?: string; showManagementActions?: boolean }) =>
    mockDashboardTopbar(props),
}))

describe('ChecklistPage', () => {
  beforeEach(() => {
    mockGetRequiredWedding.mockReset()
    mockGetTasks.mockReset()
    mockGetMilestones.mockReset()
    mockGetEvents.mockReset()
    mockChecklistPageClient.mockClear()
    mockDashboardTopbar.mockClear()
  })

  it('fetches checklist data server-side and passes it to the client component', async () => {
    mockGetRequiredWedding.mockResolvedValue(undefined)
    mockGetTasks.mockResolvedValue([{ id: 'task-1' }])
    mockGetMilestones.mockResolvedValue([{ id: 'milestone-1' }])
    mockGetEvents.mockResolvedValue([{ id: 'event-1' }])

    const page = await ChecklistPage({})
    render(page)

    expect(mockGetRequiredWedding).toHaveBeenCalledTimes(1)
    expect(mockGetTasks).toHaveBeenCalledWith({})
    expect(mockGetMilestones).toHaveBeenCalledWith({})
    expect(mockGetEvents).toHaveBeenCalledTimes(1)
    expect(mockChecklistPageClient).toHaveBeenCalledWith({
      initialTasks: [{ id: 'task-1' }],
      initialMilestones: [{ id: 'milestone-1' }],
      initialEvents: [{ id: 'event-1' }],
    })
    expect(screen.getByTestId('checklist-page-client')).toBeInTheDocument()
  })

  it('renders the authenticated page shell', async () => {
    mockGetRequiredWedding.mockResolvedValue(undefined)
    mockGetTasks.mockResolvedValue([])
    mockGetMilestones.mockResolvedValue([])
    mockGetEvents.mockResolvedValue([])

    const page = await ChecklistPage({})
    const { container } = render(page)

    expect(mockDashboardTopbar).toHaveBeenCalledWith({
      title: 'Checklist',
      showManagementActions: false,
    })
    expect(screen.getByTestId('dashboard-topbar')).toBeInTheDocument()
    expect(
      container.querySelector('main.min-h-0.flex-1.overflow-y-auto.px-4.py-5.lg\\:px-6.lg\\:py-6')
    ).toBeTruthy()
  })
})
