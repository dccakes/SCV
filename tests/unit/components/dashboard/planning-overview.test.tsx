import { act, render, screen } from '@testing-library/react'
import type { DashboardData } from '~/app/utils/shared-types'
import PlanningOverview from '~/components/dashboard/planning-overview'

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
  totalEvents: 1,
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
} as unknown as DashboardData

const mockDashboardDataWithoutPendingRsvps = {
  ...mockDashboardData,
  events: [
    {
      ...mockDashboardData.events[0],
      guestResponses: {
        ...mockDashboardData.events[0].guestResponses,
        invited: 0,
      },
    },
  ],
} as unknown as DashboardData

describe('PlanningOverview', () => {
  // ── Countdown Hero ─────────────────────────────────────────────────────────

  it('renders the days remaining value in the countdown hero', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText('440')).toBeInTheDocument()
    // "Days" label rendered uppercase alongside the number
    expect(screen.getByText('Days')).toBeInTheDocument()
  })

  it('renders Hours and Mins labels in the countdown hero', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText('Hours')).toBeInTheDocument()
    expect(screen.getByText('Mins')).toBeInTheDocument()
  })

  it('renders current hours and minutes as zero-padded strings', () => {
    // Fix the clock so the padded output is deterministic
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-03-04T09:05:00'))
    try {
      render(<PlanningOverview dashboardData={mockDashboardData} />)
      expect(screen.getByText('09')).toBeInTheDocument() // hours zero-padded
      expect(screen.getByText('05')).toBeInTheDocument() // mins zero-padded
    } finally {
      jest.useRealTimers()
    }
  })

  it('updates the minutes display when the 60-second interval fires', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-03-04T14:07:00'))
    try {
      render(<PlanningOverview dashboardData={mockDashboardData} />)

      // Initial state: 14 hours, 07 mins
      expect(screen.getByText('14')).toBeInTheDocument()
      expect(screen.getByText('07')).toBeInTheDocument()

      // Advance one full minute — interval fires once
      act(() => {
        jest.advanceTimersByTime(60_000)
      })

      // 07 should be gone, 08 should appear (14:08)
      expect(screen.queryByText('07')).not.toBeInTheDocument()
      expect(screen.getByText('08')).toBeInTheDocument()
    } finally {
      jest.useRealTimers()
    }
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

  it('does not render a fake planning progress percentage', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.queryByText(/% of planning complete/i)).not.toBeInTheDocument()
  })

  // ── Mini Stats ─────────────────────────────────────────────────────────────

  it('renders total guests count in the correct mini-stat cell', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    // 127 is unique to the "Total guests" stat
    expect(screen.getByText('127')).toBeInTheDocument()
    expect(screen.getByText('Total guests')).toBeInTheDocument()
  })

  it('renders confirmed count in MiniStats and RsvpCard (appears exactly twice)', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    // attending=89 appears in MiniStats and RSVP card
    const allEightyNine = screen.getAllByText('89')
    expect(allEightyNine).toHaveLength(2)
  })

  it('renders awaiting-reply count (pending) in the mini-stat cell', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText('Awaiting reply')).toBeInTheDocument()
    // "23" appears in MiniStats awaiting-reply cell and RSVP card pending cell
    expect(screen.getAllByText('23').length).toBeGreaterThanOrEqual(1)
  })

  it('renders events count in the MiniStats bar using totalEvents from dashboardData', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    // totalEvents=1 from mockDashboardData appears in the MiniStats Events cell
    // The value "1" is unique to this cell in the mock (no other stat has value 1)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  // ── RSVP Card ──────────────────────────────────────────────────────────────

  it('renders the RSVP Status card title', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText('RSVP Status')).toBeInTheDocument()
  })

  it('renders all four RSVP count labels', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Declined')).toBeInTheDocument()
    expect(screen.getByText('Invited')).toBeInTheDocument()
  })

  it('renders the RSVP bar with correct aria-label showing rounded percentages', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    // attending=89, pending=23, declined=8 → total=120
    // confirmedPct = round(89/120*100) = 74
    // pendingPct   = round(23/120*100) = 19
    // declinedPct  = round(8/120*100)  =  7
    const bar = screen.getByRole('img', { name: /RSVP breakdown/i })
    expect(bar).toHaveAttribute(
      'aria-label',
      'RSVP breakdown: 74% confirmed, 19% pending, 7% declined'
    )
  })

  it('renders RSVP bar segments with correct inline width percentages', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    const bar = screen.getByRole('img', { name: /RSVP breakdown/i })
    const [confirmedSeg, pendingSeg, declinedSeg] = Array.from(bar.children) as HTMLElement[]

    // attending=89/120 → 74.17%, pending=23/120 → 19.17%, declined=8/120 → 6.67%
    expect(parseFloat(confirmedSeg?.style.width)).toBeCloseTo(74.17, 1)
    expect(parseFloat(pendingSeg?.style.width)).toBeCloseTo(19.17, 1)
    expect(parseFloat(declinedSeg?.style.width)).toBeCloseTo(6.67, 1)
  })

  it('shows pending nudge text with exact count when pending > 0', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText(/Still waiting on 23/)).toBeInTheDocument()
  })

  it('renders invite collaborators CTA linking to settings', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)

    expect(screen.getByRole('link', { name: /invite collaborators/i })).toHaveAttribute(
      'href',
      '/settings'
    )
  })

  it('keeps invite collaborators CTA visible even when pending RSVPs are zero', () => {
    render(<PlanningOverview dashboardData={mockDashboardDataWithoutPendingRsvps} />)

    expect(screen.getByRole('link', { name: /invite collaborators/i })).toHaveAttribute(
      'href',
      '/settings'
    )
    expect(screen.queryByText(/Still waiting on/)).not.toBeInTheDocument()
  })

  // ── Tasks Card ─────────────────────────────────────────────────────────────

  it('renders the Upcoming tasks card title', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText('Upcoming tasks')).toBeInTheDocument()
  })

  it('renders the tasks empty state', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
    expect(screen.getByText('Task management is coming soon')).toBeInTheDocument()
  })

  it('does not render fake placeholder task rows', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.queryByText('Book ceremony venue')).not.toBeInTheDocument()
    expect(screen.queryByText('Pay rehearsal dinner deposit')).not.toBeInTheDocument()
  })

  // ── Budget Card ────────────────────────────────────────────────────────────

  it('renders the Budget card title', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    expect(screen.getByText('Budget')).toBeInTheDocument()
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

  // ── Events Card ────────────────────────────────────────────────────────────

  it('renders the Events card title', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    // 'Events' appears in both the MilestonesCard heading and the MiniStats bar
    expect(screen.getAllByText('Events').length).toBeGreaterThanOrEqual(1)
  })

  it('renders real event names from dashboardData in the Events card', () => {
    render(<PlanningOverview dashboardData={mockDashboardData} />)
    // events[0].name = 'Wedding'
    expect(screen.getByText('Wedding')).toBeInTheDocument()
  })

  it('renders the empty state when no events are provided', () => {
    const noEventsData = { ...mockDashboardData, events: [] } as unknown as DashboardData
    render(<PlanningOverview dashboardData={noEventsData} />)
    expect(screen.getByText('No events added yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /add your first event/i })).toHaveAttribute(
      'href',
      '/events'
    )
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

  it('shows zero RSVP counts when no events are provided', () => {
    const noEventsData = { ...mockDashboardData, events: [] } as unknown as DashboardData
    render(<PlanningOverview dashboardData={noEventsData} />)
    // RSVP bar should have 0/0 → all zeroes, no crash
    const bar = screen.getByRole('img', { name: /RSVP breakdown/i })
    expect(bar).toHaveAttribute(
      'aria-label',
      'RSVP breakdown: 0% confirmed, 0% pending, 0% declined'
    )
  })

  it('renders without crashing when dashboardData is null', () => {
    render(<PlanningOverview dashboardData={null} />)
    expect(screen.getByText('Your Wedding')).toBeInTheDocument()
    expect(screen.getByText('No date set')).toBeInTheDocument()
  })
})
