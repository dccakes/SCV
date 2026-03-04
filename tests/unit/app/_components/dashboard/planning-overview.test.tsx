import { render, screen, fireEvent } from '@testing-library/react'

import PlanningOverview from '~/app/_components/dashboard/planning-overview'
import type { DashboardData } from '~/app/utils/shared-types'

const mockDashboardData = {
  weddingData: {
    groomFirstName: 'Diego',
    groomLastName: 'Ramirez',
    brideFirstName: 'Holly',
    brideLastName: 'Smith',
    daysRemaining: 440,
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
    },
  },
  totalGuests: 127,
  events: [
    {
      id: 'evt1',
      name: 'Wedding',
      date: new Date('2027-05-17'),
      startTime: '14:00',
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
} as unknown as DashboardData

describe('PlanningOverview', () => {
  it('renders the countdown section with days remaining', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    // Days value appears in the hero countdown — at least one occurrence
    const dayEls = screen.getAllByText('440')
    expect(dayEls.length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/days/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders couple names in the countdown hero', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText(/Holly & Diego/)).toBeInTheDocument()
  })

  it('renders total guests count in mini stats', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    // 127 appears only in the mini stats Total guests cell
    expect(screen.getByText('127')).toBeInTheDocument()
    expect(screen.getByText(/total guests/i)).toBeInTheDocument()
  })

  it('renders confirmed RSVP count from event guestResponses', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    // 89 appears in mini stats and RSVP card — both reference the same value
    const els89 = screen.getAllByText('89')
    expect(els89.length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/confirmed/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders the RSVP Status card with all response categories', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText(/RSVP Status/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Pending/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Declined/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders the Upcoming Tasks card', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText(/upcoming tasks/i)).toBeInTheDocument()
  })

  it('renders at least one placeholder task row', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText('Book ceremony venue')).toBeInTheDocument()
  })

  it('toggles task done state when a task row is clicked', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    // "Confirm catering headcount" starts as undone — its text is NOT struck through
    const taskBtn = screen.getByRole('button', { name: /confirm catering headcount/i })
    const taskText = taskBtn.querySelectorAll('span')[1]
    expect(taskText).not.toHaveClass('line-through')
    fireEvent.click(taskBtn)
    expect(taskText).toHaveClass('line-through')
  })

  it('renders the Budget card', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText(/Budget/i, { selector: 'p' })).toBeInTheDocument()
  })

  it('renders the Vendors card', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getAllByText(/Vendors/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders the Milestones card', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText(/milestones/i)).toBeInTheDocument()
  })

  it('renders the wedding date from event data in the milestones card', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    // Date appears in both hero and milestones — verify at least one occurrence
    expect(screen.getAllByText('17 May 2027').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the countdown hero date label', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    // Hero date label — same text as milestones date
    expect(screen.getAllByText(/17 May 2027/i).length).toBeGreaterThanOrEqual(1)
  })

  it('handles null/missing dashboardData gracefully', () => {
    const emptyData = {
      weddingData: {
        groomFirstName: '',
        brideFirstName: '',
        daysRemaining: 0,
        date: { standardFormat: '', numberFormat: '' },
        website: null,
      },
      totalGuests: 0,
      events: [],
    } as unknown as DashboardData

    render(<PlanningOverview dashboardData={emptyData} />)
    // Should render without crashing; zero values appear in stats
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1)
  })

  it('handles missing guestResponses gracefully (no event)', () => {
    const noEventsData = {
      ...mockDashboardData,
      events: [],
    } as unknown as DashboardData

    render(<PlanningOverview dashboardData={noEventsData} />)
    // Confirmed stat falls back to 0 — multiple "Confirmed" labels expected
    expect(screen.getAllByText(/confirmed/i).length).toBeGreaterThanOrEqual(1)
  })
})
