import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import type { DashboardData } from '~/app/utils/shared-types'
import PlanningOverview from '~/components/dashboard/planning-overview'
import { DASHBOARD_ADD_TASK_EVENT } from '~/components/dashboard/task-dialog-events'

const mockMutate = jest.fn()
const mockCreateMutate = jest.fn()
const mockInvalidate = jest.fn()

jest.mock('~/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string
    onValueChange: (value: string) => void
    children: React.ReactNode
  }) => (
    <select
      aria-label='mock-select'
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: React.HTMLAttributes<HTMLDivElement>) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <option value=''>{placeholder}</option>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}))

const mockVendorGetAll = jest.fn()

jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({
      task: {
        getPriorityQueue: { invalidate: mockInvalidate },
      },
      dashboard: {
        getForActiveWorkspace: { invalidate: mockInvalidate },
      },
    }),
    task: {
      complete: {
        useMutation: () => ({
          mutate: mockMutate,
        }),
      },
      create: {
        useMutation: (options?: { onSuccess?: () => void }) => ({
          mutate: (input: unknown) => {
            mockCreateMutate(input)
            options?.onSuccess?.()
          },
        }),
      },
    },
    vendor: {
      getAll: {
        useQuery: () => mockVendorGetAll(),
      },
    },
  },
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}))

const mockDashboardData = {
  weddingData: {
    groomFirstName: 'Diego',
    groomLastName: 'Ramirez',
    brideFirstName: 'Holly',
    brideLastName: 'Smith',
    daysRemaining: 440,
    location: 'Hacienda Los Laureles',
    date: { standardFormat: '17 May 2027', numberFormat: '2027-05-17' },
    website: {
      id: 'site-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      weddingId: 'wedding-1',
      url: 'https://example.com',
      subUrl: 'holly-diego',
      isPasswordEnabled: false,
      isRsvpEnabled: true,
      password: null,
      generalQuestions: [],
    },
  },
  totalGuests: 127,
  totalEvents: 1,
  tasksDueThisMonth: 3,
  taskPriorityQueue: {
    totalActive: 7,
    tasks: [
      {
        id: 'task-1',
        weddingId: 'wedding-1',
        eventId: 'evt1',
        vendorId: null,
        milestoneId: null,
        seedKey: null,
        title: 'Pay rehearsal dinner deposit',
        category: 'BUDGET',
        monthsBeforeWedding: 1,
        dueDate: new Date('2026-04-20T00:00:00.000Z'),
        description: null,
        notes: null,
        isDefault: false,
        position: 0,
        completed: false,
        completedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
      {
        id: 'task-2',
        weddingId: 'wedding-1',
        eventId: 'evt1',
        vendorId: null,
        milestoneId: null,
        seedKey: null,
        title: 'Confirm catering headcount',
        category: 'RECEPTION',
        monthsBeforeWedding: 0,
        dueDate: new Date('2026-04-29T00:00:00.000Z'),
        description: null,
        notes: null,
        isDefault: false,
        position: 1,
        completed: false,
        completedAt: null,
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
        updatedAt: new Date('2026-01-04T00:00:00.000Z'),
      },
    ],
  },
  milestones: [
    {
      id: 'milestone-1',
      weddingId: 'wedding-1',
      key: 'venue_booked',
      title: 'Venue booked',
      category: 'VENDORS',
      position: 2,
      targetDate: null,
      userOverrideStatus: null,
      attestedAt: null,
      dismissedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      derivedStatus: 'done',
      effectiveStatus: 'done',
    },
    {
      id: 'milestone-2',
      weddingId: 'wedding-1',
      key: 'invitations_sent',
      title: 'Invitations sent',
      category: 'INVITATIONS',
      position: 7,
      targetDate: null,
      userOverrideStatus: 'attested',
      attestedAt: new Date('2026-02-01T00:00:00.000Z'),
      dismissedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      derivedStatus: 'pending',
      effectiveStatus: 'done',
    },
    {
      id: 'milestone-3',
      weddingId: 'wedding-1',
      key: 'wedding_day',
      title: 'Wedding day',
      category: 'FINALE',
      position: 12,
      targetDate: null,
      userOverrideStatus: null,
      attestedAt: null,
      dismissedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      derivedStatus: 'pending',
      effectiveStatus: 'pending',
    },
  ],
  events: [
    {
      id: 'evt1',
      name: 'Wedding',
      date: new Date('2027-05-17'),
      startTime: '16:00',
      endTime: '22:00',
      venue: 'Hacienda Los Laureles',
      attire: 'Black tie',
      description: null,
      weddingId: 'wedding-1',
      questions: [],
      collectRsvp: true,
      guestResponses: {
        attending: 89,
        invited: 23,
        declined: 8,
        notInvited: 7,
      },
    },
  ],
  households: [],
} as unknown as DashboardData

describe('PlanningOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVendorGetAll.mockReturnValue({ data: undefined })
  })

  it('renders the real planning completion percentage from milestones', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)

    expect(screen.getByText(/67% of planning complete/i)).toBeInTheDocument()
  })

  it('renders couple names in the countdown hero', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText('Holly & Diego')).toBeInTheDocument()
  })

  it('renders the wedding date in the hero', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    // standardFormat date string appears in the hero
    expect(screen.getByText('17 May 2027')).toBeInTheDocument()
  })

  it('renders tasks due this month in mini stats', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)

    expect(screen.getByText('Tasks due this month')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders real priority queue tasks and the checklist link', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)

    expect(screen.getByText('Pay rehearsal dinner deposit')).toBeInTheDocument()
    expect(screen.getByText('Confirm catering headcount')).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('link', { name: /view all/i })
        .some((link) => link.getAttribute('href') === '/checklist')
    ).toBe(true)
    expect(screen.getByText('2 of 7 active tasks shown')).toBeInTheDocument()
  })

  it('toggles a task and calls the completion mutation', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)

    const taskButton = screen.getByRole('button', { name: /confirm catering headcount/i })
    fireEvent.click(taskButton)

    expect(mockMutate).toHaveBeenCalledWith({
      taskId: 'task-2',
      completed: true,
    })
  })

  it('opens the quick-add dialog from the dashboard event and creates a task', async () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)

    act(() => {
      window.dispatchEvent(new CustomEvent(DASHBOARD_ADD_TASK_EVENT))
    })

    await waitFor(() => expect(screen.getByLabelText('Task title')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Chase the final vendor invoice' },
    })
    fireEvent.change(screen.getAllByLabelText('mock-select')[0], {
      target: { value: 'VENDORS' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save task' }))

    await waitFor(() =>
      expect(mockCreateMutate).toHaveBeenCalledWith({
        title: 'Chase the final vendor invoice',
        category: 'VENDORS',
        eventId: 'evt1',
        monthsBeforeWedding: 3,
        dueDate: null,
        description: null,
        notes: null,
      })
    )
  })

  it('renders the budget empty state', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText('No budget set up yet')).toBeInTheDocument()
    expect(screen.getByText(/Budget tracking coming soon/)).toBeInTheDocument()
  })

  it('does not render fake budget category names', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.queryByText('Flowers')).not.toBeInTheDocument()
    expect(screen.queryByText('Photography')).not.toBeInTheDocument()
  })

  // ── Vendors Card ───────────────────────────────────────────────────────────

  it('renders the Vendors card title', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText('Vendors')).toBeInTheDocument()
  })

  it('renders the vendors empty state when no vendors are added', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText('No vendors added yet')).toBeInTheDocument()
    expect(
      screen.getByText('Track quotes, contacts, and contracts in one place')
    ).toBeInTheDocument()
  })

  it('renders an add vendor CTA link in the vendors empty state', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText('Add your first vendor →')).toBeInTheDocument()
  })

  it('renders real vendor count and status breakdown when vendors exist', () => {
    mockVendorGetAll.mockReturnValue({
      data: [
        { id: 'v1', status: 'SELECTED' },
        { id: 'v2', status: 'IN_NEGOTIATION' },
        { id: 'v3', status: 'PRE_SELECTED' },
        { id: 'v4', status: 'IN_REVIEW' },
      ],
    })

    render(<PlanningOverview dashboardData={mockDashboardData} />)

    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('vendors tracked')).toBeInTheDocument()
    expect(screen.getByText('Selected')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('In Review')).toBeInTheDocument()
    expect(screen.queryByText('No vendors added yet')).not.toBeInTheDocument()
  })

  // ── Edge Cases ─────────────────────────────────────────────────────────────

  it('falls back to "Your Wedding" couple name when both names are empty', () => {
    const emptyData = {
      ...mockDashboardData,
      weddingData: {
        ...mockDashboardData.weddingData,
        brideFirstName: '',
        groomFirstName: '',
        daysRemaining: 0,
      },
      totalGuests: 0,
      events: [],
    } as unknown as DashboardData

    render(<PlanningOverview dashboardData={emptyData} />)
    expect(screen.getByText('Your Wedding')).toBeInTheDocument()
    // Multiple "0" values render across stats cells — verify at least one exists
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1)
  })

  it('shows RSVP empty state when no RSVP data exists', () => {
    const noEventsData = { ...mockDashboardData, events: [] } as unknown as DashboardData
    render(<PlanningOverview dashboardData={noEventsData} />)
    // Empty state should render instead of the zero-count bar
    expect(screen.getByText('No RSVPs collected yet')).toBeInTheDocument()
    expect(
      screen.getByText('Enable RSVP collection on one of your events to start tracking responses')
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Set up RSVPs →' })).toHaveAttribute('href', '/events')
    // The RSVP bar should not render
    expect(screen.queryByRole('img', { name: /RSVP breakdown/i })).not.toBeInTheDocument()
  })

  it('renders real milestones including override and wedding-day indicators', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)

    expect(screen.getByText('Venue booked')).toBeInTheDocument()
    expect(screen.getByText('Invitations sent ⚠')).toBeInTheDocument()
    expect(screen.getByText('Wedding day ✦')).toBeInTheDocument()
  })

  it('renders empty-state task copy when there are no active tasks', () => {
    render(
      <PlanningOverview
        dashboardData={{
          ...mockDashboardData,
          taskPriorityQueue: { tasks: [], totalActive: 0 },
        }}
      />
    )

    expect(screen.getByText(/No active tasks yet/i)).toBeInTheDocument()
  })

  it('renders without crashing when dashboardData is null', () => {
    render(<PlanningOverview dashboardData={null} />)

    expect(screen.getByText('Your Wedding')).toBeInTheDocument()
    expect(screen.getByText('No date set')).toBeInTheDocument()
  })
})
