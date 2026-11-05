import { render, screen } from '@testing-library/react'

import { EventCard } from '~/app/(authenicated)/events/_components/event-card'
import { EventsPageClient } from '~/app/(authenicated)/events/_components/events-page-client'
import { ManageEventGuestsDialog } from '~/app/(authenicated)/events/_components/manage-event-guests-dialog'
import { ManageEventQuestionsDialog } from '~/app/(authenicated)/events/_components/manage-event-questions-dialog'
import { WorkspaceCapabilitiesProvider } from '~/components/contexts/workspace-capabilities-context'
import type { EventWithStats } from '~/server/domains/event/event.types'

const mockEvent = {
  id: 'evt-1',
  name: 'Ceremony',
  date: new Date('2027-05-17T00:00:00.000Z'),
  startTime: null,
  endTime: null,
  venue: 'Main Hall',
  attire: null,
  description: null,
  weddingId: 'wed-1',
  collectRsvp: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  guestResponses: { attending: 1, invited: 1, declined: 0, notInvited: 0 },
  estimatedAttendance: 2,
  questions: [{ id: 'q1', text: 'Meal choice?', type: 'Text', options: [] }],
} as unknown as EventWithStats

const mockDashboardData = {
  households: [
    {
      guests: [
        {
          id: 1,
          firstName: 'Ann',
          lastName: 'Lee',
          invitations: [{ eventId: 'evt-1', rsvp: 'Invited' }],
        },
      ],
    },
  ],
}

jest.mock('~/components/forms/event/modern-event-form', () => ({
  ModernEventForm: () => <div data-testid='event-form' />,
}))

jest.mock('~/trpc/react', () => {
  const mutation = () => ({ mutate: jest.fn(), mutateAsync: jest.fn(), isPending: false })
  return {
    api: {
      useUtils: () => ({
        event: { getAllByUserIdWithStats: { invalidate: jest.fn(), setData: jest.fn() } },
        dashboard: { getForActiveWorkspace: { invalidate: jest.fn() } },
        question: { getWebsiteQuestions: { invalidate: jest.fn() } },
      }),
      event: {
        getAllByUserIdWithStats: { useQuery: () => ({ data: [mockEvent], isLoading: false }) },
        create: { useMutation: mutation },
        update: { useMutation: mutation },
        delete: { useMutation: mutation },
        updateCollectRsvp: { useMutation: mutation },
      },
      invitation: { bulkUpdate: { useMutation: mutation } },
      question: {
        delete: { useMutation: mutation },
        upsert: { useMutation: mutation },
        getWebsiteQuestions: { useQuery: () => ({ data: null, isLoading: false }) },
      },
      dashboard: {
        getForActiveWorkspace: {
          useQuery: () => ({
            data: mockDashboardData,
            isLoading: false,
          }),
        },
      },
    },
  }
})

const cardProps = {
  event: mockEvent,
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onManageGuests: jest.fn(),
  onManageQuestions: jest.fn(),
  onToggleCollectRsvp: jest.fn(),
}

const asViewer = (ui: React.ReactElement) =>
  render(
    <WorkspaceCapabilitiesProvider canEditPlanning={false}>{ui}</WorkspaceCapabilitiesProvider>
  )

describe('events page: viewer vs editor', () => {
  it('editor sees write controls on the event card', () => {
    render(<EventCard {...cardProps} />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /event actions/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /manage guests/i })).toBeInTheDocument()
  })

  it('viewer sees event details but no write controls on the event card', () => {
    asViewer(<EventCard {...cardProps} />)
    expect(screen.getByText('Ceremony')).toBeInTheDocument()
    expect(screen.getByText('Main Hall')).toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /event actions/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /manage guests/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view guests/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /rsvp questions/i })).toBeInTheDocument()
  })

  it('viewer page hides create event but keeps events and read-only questions', () => {
    asViewer(<EventsPageClient initialEvents={[mockEvent]} />)
    expect(screen.getByText('Ceremony')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /create event/i })).not.toBeInTheDocument()
  })

  it('editor page shows create event', () => {
    render(<EventsPageClient initialEvents={[mockEvent]} />)
    expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument()
  })

  it('viewer guest dialog lists guests without invite or save controls', () => {
    asViewer(<ManageEventGuestsDialog event={mockEvent} open onOpenChange={jest.fn()} />)
    expect(screen.getByText('Ann Lee')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^invite all$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^save/i })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /close/i }).length).toBeGreaterThan(0)
  })

  it('editor guest dialog shows invite and save controls', () => {
    render(<ManageEventGuestsDialog event={mockEvent} open onOpenChange={jest.fn()} />)
    expect(screen.getByRole('button', { name: /^invite all$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^save/i })).toBeInTheDocument()
  })

  it('viewer question dialog shows questions without add/edit/delete', () => {
    asViewer(<ManageEventQuestionsDialog event={mockEvent} open onOpenChange={jest.fn()} />)
    expect(screen.getByText('Meal choice?')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add question/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit question/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete question/i })).not.toBeInTheDocument()
  })

  it('editor question dialog shows add/edit/delete', () => {
    render(<ManageEventQuestionsDialog event={mockEvent} open onOpenChange={jest.fn()} />)
    expect(screen.getByRole('button', { name: /add question/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit question/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete question/i })).toBeInTheDocument()
  })
})
