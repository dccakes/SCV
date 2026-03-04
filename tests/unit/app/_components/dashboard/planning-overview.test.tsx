import { render, screen } from '@testing-library/react'

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
    expect(screen.getAllByText('440').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/days/i).length).toBeGreaterThan(0)
  })

  it('renders couple names in the countdown hero', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText(/Holly & Diego/)).toBeInTheDocument()
  })

  it('renders total guests count in mini stats', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getAllByText('127').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/total guests/i).length).toBeGreaterThan(0)
  })

  it('renders confirmed RSVP count from event guestResponses', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getAllByText('89').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/confirmed/i).length).toBeGreaterThan(0)
  })

  it('renders the RSVP Status card', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText(/RSVP Status/i)).toBeInTheDocument()
  })

  it('renders the Upcoming Tasks card', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText(/upcoming tasks/i)).toBeInTheDocument()
  })

  it('renders the Budget card', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getAllByText(/budget/i).length).toBeGreaterThan(0)
  })

  it('renders the Vendors card', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getAllByText(/vendors/i).length).toBeGreaterThan(0)
  })

  it('renders the Milestones card', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText(/milestones/i)).toBeInTheDocument()
  })

  it('renders the wedding date from event data', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getAllByText(/17 May 2027/i).length).toBeGreaterThan(0)
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
    expect(screen.getAllByText('0').length).toBeGreaterThan(0)
  })
})
