import { act, fireEvent, render, screen } from '@testing-library/react'
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
  households: [],
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
      createdAt: new Date(),
      updatedAt: new Date(),
      guestResponses: {
        attending: 89,
        invited: 23,
        declined: 8,
        notInvited: 7,
      },
    },
  ],
} as unknown as DashboardData

// Mock tRPC hooks
const mockDashboardQuery = { data: mockDashboardData, isLoading: false }
const mockVendorQuery = { data: [], isLoading: false }

jest.mock('~/trpc/react', () => ({
  api: {
    dashboard: {
      getForActiveWorkspace: {
        useQuery: () => mockDashboardQuery,
      },
    },
    vendor: {
      getAll: {
        useQuery: () => mockVendorQuery,
      },
    },
  },
}))

describe('PlanningOverview', () => {
  // ── Countdown Hero ─────────────────────────────────────────────────────────

  it('renders the days remaining value in the countdown hero', () => {
    render(<PlanningOverview />)
    expect(screen.getByText('440')).toBeInTheDocument()
    expect(screen.getByText('Days')).toBeInTheDocument()
  })

  it('renders Hours and Mins labels in the countdown hero', () => {
    render(<PlanningOverview />)
    expect(screen.getByText('Hours')).toBeInTheDocument()
    expect(screen.getByText('Mins')).toBeInTheDocument()
  })

  it('renders current hours and minutes as zero-padded strings', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-03-04T09:05:00'))
    try {
      render(<PlanningOverview />)
      expect(screen.getByText('09')).toBeInTheDocument()
      expect(screen.getByText('05')).toBeInTheDocument()
    } finally {
      jest.useRealTimers()
    }
  })

  it('updates the minutes display when the 60-second interval fires', () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-03-04T14:07:00'))
    try {
      render(<PlanningOverview />)
      expect(screen.getByText('14')).toBeInTheDocument()
      expect(screen.getByText('07')).toBeInTheDocument()

      act(() => {
        jest.advanceTimersByTime(60_000)
      })

      expect(screen.queryByText('07')).not.toBeInTheDocument()
      expect(screen.getByText('08')).toBeInTheDocument()
    } finally {
      jest.useRealTimers()
    }
  })

  it('renders couple names in the countdown hero', () => {
    render(<PlanningOverview />)
    expect(screen.getByText('Holly & Diego')).toBeInTheDocument()
  })

  it('renders the wedding date in the hero', () => {
    render(<PlanningOverview />)
    const dateEls = screen.getAllByText('17 May 2027')
    expect(dateEls.length).toBeGreaterThanOrEqual(1)
  })

  // ── Mini Stats ─────────────────────────────────────────────────────────────

  it('renders total guests count in the correct mini-stat cell', () => {
    render(<PlanningOverview />)
    expect(screen.getByText('127')).toBeInTheDocument()
    expect(screen.getByText('Total guests')).toBeInTheDocument()
  })

  it('renders confirmed count in MiniStats and RsvpCard (appears exactly twice)', () => {
    render(<PlanningOverview />)
    const allEightyNine = screen.getAllByText('89')
    expect(allEightyNine).toHaveLength(2)
  })

  it('renders awaiting-reply count (pending) in the mini-stat cell', () => {
    render(<PlanningOverview />)
    expect(screen.getByText('Awaiting reply')).toBeInTheDocument()
    expect(screen.getAllByText('23').length).toBeGreaterThanOrEqual(1)
  })

  // ── RSVP Card ──────────────────────────────────────────────────────────────

  it('renders the RSVP Status card title', () => {
    render(<PlanningOverview />)
    expect(screen.getByText('RSVP Status')).toBeInTheDocument()
  })

  it('renders all four RSVP count labels', () => {
    render(<PlanningOverview />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Declined')).toBeInTheDocument()
    expect(screen.getByText('Invited')).toBeInTheDocument()
  })

  it('renders the RSVP bar with correct aria-label showing rounded percentages', () => {
    render(<PlanningOverview />)
    const bar = screen.getByRole('img', { name: /RSVP breakdown/i })
    expect(bar).toHaveAttribute(
      'aria-label',
      'RSVP breakdown: 74% confirmed, 19% pending, 7% declined'
    )
  })

  it('renders RSVP bar segments with correct inline width percentages', () => {
    render(<PlanningOverview />)
    const bar = screen.getByRole('img', { name: /RSVP breakdown/i })
    const [confirmedSeg, pendingSeg, declinedSeg] = Array.from(bar.children) as HTMLElement[]

    expect(parseFloat(confirmedSeg?.style.width)).toBeCloseTo(74.17, 1)
    expect(parseFloat(pendingSeg?.style.width)).toBeCloseTo(19.17, 1)
    expect(parseFloat(declinedSeg?.style.width)).toBeCloseTo(6.67, 1)
  })

  it('shows pending nudge text with exact count when pending > 0', () => {
    render(<PlanningOverview />)
    expect(screen.getByText(/Still waiting on 23/)).toBeInTheDocument()
  })

  // ── Tasks Card ─────────────────────────────────────────────────────────────

  it('renders the Upcoming tasks card title', () => {
    render(<PlanningOverview />)
    expect(screen.getByText('Upcoming tasks')).toBeInTheDocument()
  })

  it('renders specific placeholder task rows', () => {
    render(<PlanningOverview />)
    expect(screen.getByText('Book ceremony venue')).toBeInTheDocument()
    expect(screen.getByText('Confirm catering headcount')).toBeInTheDocument()
    expect(screen.getByText('Pay rehearsal dinner deposit')).toBeInTheDocument()
  })

  it('toggles task done state when a task row is clicked', () => {
    render(<PlanningOverview />)
    const taskBtn = screen.getByRole('button', { name: /confirm catering headcount/i })
    const taskText = taskBtn.querySelectorAll('span')[1]
    expect(taskText).not.toHaveClass('line-through')
    fireEvent.click(taskBtn)
    expect(taskText).toHaveClass('line-through')
  })

  it('marks pre-done tasks with line-through from the start', () => {
    render(<PlanningOverview />)
    const taskBtn = screen.getByRole('button', { name: /book ceremony venue/i })
    const taskText = taskBtn.querySelectorAll('span')[1]
    expect(taskText).toHaveClass('line-through')
  })

  // ── Budget Card ────────────────────────────────────────────────────────────

  it('renders the Budget card title', () => {
    render(<PlanningOverview />)
    expect(screen.getByText('Budget')).toBeInTheDocument()
  })

  it('renders all budget category names', () => {
    render(<PlanningOverview />)
    expect(screen.getAllByText('Venue').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Catering').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Photography').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Flowers').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  // ── Vendors Card ───────────────────────────────────────────────────────────

  it('renders the Vendors card title', () => {
    render(<PlanningOverview />)
    expect(screen.getByText('Vendors')).toBeInTheDocument()
  })

  it('renders empty state when no vendors exist', () => {
    render(<PlanningOverview />)
    expect(screen.getByText('No vendors yet')).toBeInTheDocument()
  })

  // ── Milestones Card ────────────────────────────────────────────────────────

  it('renders the Milestones card title', () => {
    render(<PlanningOverview />)
    expect(screen.getByText('Milestones')).toBeInTheDocument()
  })

  it('renders the wedding event name as a highlighted milestone', () => {
    render(<PlanningOverview />)
    expect(screen.getByText('Wedding ✦')).toBeInTheDocument()
  })

  it('renders milestone date from event data', () => {
    render(<PlanningOverview />)
    expect(screen.getByText('May 17, 2027')).toBeInTheDocument()
  })
})
