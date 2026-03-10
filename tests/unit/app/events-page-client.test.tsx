import { fireEvent, render, screen } from '@testing-library/react'

import { EventsPageClient } from '~/app/(authenicated)/events/_components/events-page-client'
import type { EventWithStats } from '~/server/domains/event/event.types'

const mockUseQuery = jest.fn()
const mockCreateMutateAsync = jest.fn()
const mockUpdateMutateAsync = jest.fn()
const mockDeleteMutate = jest.fn()
const mockInvalidate = jest.fn()
const mockModernEventForm = jest.fn(({ event }: { event?: { id: string } }) => (
  <div data-testid={event ? 'edit-event-form' : 'create-event-form'} />
))

jest.mock('~/app/_components/forms/event/modern-event-form', () => ({
  ModernEventForm: (props: { event?: { id: string } }) => mockModernEventForm(props),
}))

jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({
      event: {
        getAllByUserIdWithStats: {
          invalidate: (...args: unknown[]) => mockInvalidate(...args),
        },
      },
    }),
    event: {
      getAllByUserIdWithStats: {
        useQuery: (...args: unknown[]) => mockUseQuery(...args),
      },
      create: {
        useMutation: () => ({
          mutateAsync: (...args: unknown[]) => mockCreateMutateAsync(...args),
          isPending: false,
        }),
      },
      update: {
        useMutation: () => ({
          mutateAsync: (...args: unknown[]) => mockUpdateMutateAsync(...args),
          isPending: false,
        }),
      },
      delete: {
        useMutation: () => ({
          mutate: (...args: unknown[]) => mockDeleteMutate(...args),
          isPending: false,
        }),
      },
    },
  },
}))

const baseEvent: EventWithStats = {
  id: 'evt-1',
  name: 'Ceremony',
  date: new Date('2027-05-17T00:00:00.000Z'),
  startTime: null,
  endTime: null,
  venue: null,
  attire: null,
  description: null,
  weddingId: 'wed-1',
  collectRsvp: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  guestResponses: {
    attending: 10,
    invited: 5,
    declined: 2,
    notInvited: 0,
  },
}

describe('EventsPageClient', () => {
  beforeEach(() => {
    mockUseQuery.mockReset()
    mockCreateMutateAsync.mockReset()
    mockUpdateMutateAsync.mockReset()
    mockDeleteMutate.mockReset()
    mockInvalidate.mockReset()
    mockModernEventForm.mockClear()

    mockUseQuery.mockReturnValue({
      data: [baseEvent],
      isLoading: false,
    })
  })

  it('seeds query with server-provided initialEvents', () => {
    render(<EventsPageClient initialEvents={[baseEvent]} />)

    expect(mockUseQuery).toHaveBeenCalledWith(undefined, {
      initialData: [baseEvent],
    })
  })

  it('does not render event forms before a dialog is opened', () => {
    render(<EventsPageClient initialEvents={[baseEvent]} />)

    expect(screen.queryByTestId('create-event-form')).not.toBeInTheDocument()
    expect(screen.queryByTestId('edit-event-form')).not.toBeInTheDocument()
  })

  it('renders create form only after create action is clicked', () => {
    render(<EventsPageClient initialEvents={[baseEvent]} />)

    fireEvent.click(screen.getByRole('button', { name: /create event/i }))
    expect(screen.getByTestId('create-event-form')).toBeInTheDocument()
    expect(mockModernEventForm).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'create',
      })
    )
  })

  it('renders edit form only after edit action is clicked', () => {
    render(<EventsPageClient initialEvents={[baseEvent]} />)

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByTestId('edit-event-form')).toBeInTheDocument()
    expect(mockModernEventForm).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'edit',
        event: baseEvent,
      })
    )
  })

  it('shows RSVP context banner when arriving from guest drawer link', () => {
    render(<EventsPageClient initialEvents={[baseEvent]} initialRsvpEventId='evt-1' />)

    expect(screen.getByText('RSVP management context: Ceremony')).toBeInTheDocument()
  })
})
