import { fireEvent, render, screen } from '@testing-library/react'

import { EventsPageClient } from '~/app/(authenicated)/events/_components/events-page-client'
import type { EventWithStats } from '~/server/domains/event/event.types'

const mockUseQuery = jest.fn()
const mockCreateMutateAsync = jest.fn()
const mockUpdateMutateAsync = jest.fn()
const mockDeleteMutate = jest.fn()
const mockInvalidate = jest.fn()
const mockSetData = jest.fn()
let mockUpdateOnSuccess: ((data?: EventWithStats) => Promise<void> | void) | undefined
let mockDeleteOnSuccess: ((deletedEventId?: string) => Promise<void> | void) | undefined
const mockModernEventForm = jest.fn(({ event }: { event?: { id: string } }) => (
  <div data-testid={event ? 'edit-event-form' : 'create-event-form'} />
))

jest.mock('~/components/forms/event/modern-event-form', () => ({
  ModernEventForm: (props: { event?: { id: string } }) => mockModernEventForm(props),
}))

jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({
      event: {
        getAllByUserIdWithStats: {
          invalidate: (...args: unknown[]) => mockInvalidate(...args),
          setData: (...args: unknown[]) => mockSetData(...args),
        },
      },
      dashboard: {
        getForActiveWorkspace: {
          invalidate: jest.fn(),
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
        useMutation: (options?: {
          onSuccess?: (data?: EventWithStats) => Promise<void> | void
        }) => {
          mockUpdateOnSuccess = options?.onSuccess
          return {
            mutateAsync: (...args: unknown[]) => mockUpdateMutateAsync(...args),
            isPending: false,
          }
        },
      },
      delete: {
        useMutation: (options?: {
          onSuccess?: (deletedEventId?: string) => Promise<void> | void
        }) => {
          mockDeleteOnSuccess = options?.onSuccess
          return {
            mutate: (...args: unknown[]) => mockDeleteMutate(...args),
            isPending: false,
          }
        },
      },
    },
    invitation: {
      bulkUpdate: {
        useMutation: () => ({
          mutate: jest.fn(),
          isPending: false,
        }),
      },
    },
    dashboard: {
      getForActiveWorkspace: {
        useQuery: () => ({
          data: undefined,
          isLoading: false,
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
  estimatedAttendance: 12,
}

describe('EventsPageClient', () => {
  beforeEach(() => {
    mockUseQuery.mockReset()
    mockCreateMutateAsync.mockReset()
    mockUpdateMutateAsync.mockReset()
    mockDeleteMutate.mockReset()
    mockInvalidate.mockReset()
    mockSetData.mockReset()
    mockModernEventForm.mockClear()
    mockUpdateOnSuccess = undefined
    mockDeleteOnSuccess = undefined

    mockUseQuery.mockReturnValue({
      data: [baseEvent],
      isLoading: false,
    })
  })

  it('seeds query with server-provided initialEvents', () => {
    render(<EventsPageClient initialEvents={[baseEvent]} />)

    expect(mockUseQuery).toHaveBeenCalledWith(undefined, {
      initialData: [baseEvent],
      staleTime: 30_000,
    })
  })

  it('updates event cache directly after update mutation success', async () => {
    render(<EventsPageClient initialEvents={[baseEvent]} />)

    await mockUpdateOnSuccess?.({
      ...baseEvent,
      name: 'Updated Ceremony',
    })

    expect(mockSetData).toHaveBeenCalledWith(undefined, expect.any(Function))
    expect(mockInvalidate).not.toHaveBeenCalled()
  })

  it('removes event from cache directly after delete mutation success', async () => {
    render(<EventsPageClient initialEvents={[baseEvent]} />)

    await mockDeleteOnSuccess?.('evt-1')

    expect(mockSetData).toHaveBeenCalledWith(undefined, expect.any(Function))
    expect(mockInvalidate).not.toHaveBeenCalled()
  })

  it('does not render event forms before a dialog is opened', () => {
    render(<EventsPageClient initialEvents={[baseEvent]} />)

    expect(screen.queryByTestId('create-event-form')).not.toBeInTheDocument()
    expect(screen.queryByTestId('edit-event-form')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete Event?')).not.toBeInTheDocument()
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

  it('renders actions dropdown trigger for each event card', () => {
    render(<EventsPageClient initialEvents={[baseEvent]} />)

    expect(screen.getByRole('button', { name: /event actions/i })).toBeInTheDocument()
  })

  it('shows RSVP context banner when arriving from guest drawer link', () => {
    render(<EventsPageClient initialEvents={[baseEvent]} initialRsvpEventId='evt-1' />)

    expect(screen.getByText('RSVP management context: Ceremony')).toBeInTheDocument()
  })
})
