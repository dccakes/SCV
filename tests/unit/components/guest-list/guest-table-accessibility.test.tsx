import { fireEvent, render, screen } from '@testing-library/react'

import GuestTable from '~/components/guest-list/guest-table'
import type { HouseholdWithGuests } from '~/server/application/dashboard/dashboard.types'

const mockToggleGuestForm = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}))

jest.mock('~/components/contexts/guest-form-context', () => ({
  useToggleGuestForm: () => mockToggleGuestForm,
}))

jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({
      dashboard: {
        getByUserId: {
          invalidate: jest.fn(),
        },
      },
    }),
    gift: {
      update: {
        useMutation: () => ({ mutate: jest.fn(), isPending: false }),
      },
    },
    invitation: {
      update: {
        useMutation: () => ({ mutate: jest.fn(), isPending: false }),
      },
    },
  },
}))

const events = [
  {
    id: 'event-1',
    name: 'Wedding Day',
    date: new Date('2026-06-01T00:00:00.000Z'),
    startTime: null,
    endTime: null,
    venue: null,
    attire: null,
    description: null,
    weddingId: 'wedding-1',
    questions: [],
  },
]

const households: HouseholdWithGuests[] = [
  {
    id: 'household-1',
    weddingId: 'wedding-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    address1: '123 Main St',
    address2: null,
    city: 'Austin',
    state: 'TX',
    zipCode: '73301',
    country: 'US',
    notes: null,
    guests: [
      {
        id: 1,
        firstName: 'Alex',
        lastName: 'Rivera',
        email: 'alex@example.com',
        phone: '+12025550111',
        householdId: 'household-1',
        weddingId: 'wedding-1',
        isPrimaryContact: true,
        ageGroup: 'ADULT',
        guestTags: [],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        invitations: [
          {
            id: 'inv-1',
            weddingId: 'wedding-1',
            guestId: 1,
            eventId: 'event-1',
            rsvp: 'Invited',
            dietaryRestrictions: null,
            submittedBy: null,
            submittedAt: null,
            invitedAt: new Date('2026-01-01T00:00:00.000Z'),
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
        ],
      },
    ],
    gifts: [],
  },
]

describe('GuestTable accessibility', () => {
  beforeEach(() => {
    mockToggleGuestForm.mockReset()
  })

  it('should render semantic household action buttons', () => {
    render(
      <GuestTable
        events={events}
        households={households}
        selectedEventId='all'
        setPrefillHousehold={jest.fn()}
      />
    )

    const householdButton = screen.getByRole('button', {
      name: 'Select Alex Rivera household',
    })

    expect(householdButton).toHaveAttribute('type', 'button')
    householdButton.focus()
    expect(householdButton).toHaveFocus()

    fireEvent.click(householdButton)
    expect(mockToggleGuestForm).toHaveBeenCalledTimes(1)
  })
})
