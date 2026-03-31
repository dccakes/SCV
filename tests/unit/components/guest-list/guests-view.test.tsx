import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import GuestsView from '~/components/guest-list/guests-view'
import type { HouseholdWithGuests } from '~/server/application/dashboard/dashboard.types'

const mockToggleGuestForm = jest.fn()
const mockRefresh = jest.fn()
const mockHouseholdUpdateMutate = jest.fn()
const mockDashboardInvalidate = jest.fn()
let shouldMutationFail = false
let deferMutationResolution = false
let pendingMutationSuccess: (() => void) | undefined

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}))

jest.mock('~/components/contexts/guest-form-context', () => ({
  useToggleGuestForm: () => mockToggleGuestForm,
}))

jest.mock('~/components/contexts/event-form-context', () => ({
  useToggleEventForm: () => jest.fn(),
}))

jest.mock('~/components/guest-list/tag-input', () => ({
  TagInput: ({ ariaLabel }: { ariaLabel: string }) => <div data-testid={ariaLabel} />,
}))

jest.mock('~/components/hooks', () => {
  const React = require('react')
  return {
    useOuterClick: () => React.createRef(),
  }
})

let mockTagsData: Array<{ id: string; name: string; color?: string | null }> = []

jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({
      dashboard: {
        getByUserId: {
          invalidate: (...args: unknown[]) => mockDashboardInvalidate(...args),
        },
      },
    }),
    guestTag: {
      getAll: {
        useQuery: () => ({ data: mockTagsData, refetch: jest.fn() }),
      },
      create: {
        useMutation: () => ({ mutate: jest.fn() }),
      },
    },
    household: {
      update: {
        useMutation: () => ({
          mutate: (
            payload: unknown,
            options?: {
              onSuccess?: () => void
              onError?: () => void
            }
          ) => {
            mockHouseholdUpdateMutate(payload)

            const resolveSuccess = () => options?.onSuccess?.()
            const resolveError = () => options?.onError?.()

            if (deferMutationResolution) {
              pendingMutationSuccess = resolveSuccess
              return
            }

            if (shouldMutationFail) {
              resolveError()
              return
            }

            resolveSuccess()
          },
          isPending: false,
        }),
      },
      delete: {
        useMutation: () => ({
          mutate: (
            _payload: unknown,
            options?: {
              onSuccess?: () => void
              onError?: () => void
            }
          ) => {
            options?.onSuccess?.()
          },
          isPending: false,
        }),
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
  {
    id: 'event-2',
    name: 'Welcome Party',
    date: new Date('2026-05-31T00:00:00.000Z'),
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
    notes: 'Vegetarian meals only',
    guests: [
      {
        id: 1,
        firstName: 'Alex',
        lastName: 'Rivera',
        email: 'alex@example.com',
        phone: '555-1111',
        householdId: 'household-1',
        weddingId: 'wedding-1',
        isPrimaryContact: true,
        ageGroup: 'ADULT',
        guestTags: [{ tagId: 'family' }],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        invitations: [
          {
            id: 'inv-1',
            weddingId: 'wedding-1',
            guestId: 1,
            eventId: 'event-1',
            rsvp: 'Attending',
            dietaryRestrictions: null,
            submittedBy: null,
            submittedAt: null,
            invitedAt: new Date('2026-01-01T00:00:00.000Z'),
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
          {
            id: 'inv-2',
            weddingId: 'wedding-1',
            guestId: 1,
            eventId: 'event-2',
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
      {
        id: 2,
        firstName: 'Jamie',
        lastName: 'Rivera',
        email: null,
        phone: null,
        householdId: 'household-1',
        weddingId: 'wedding-1',
        isPrimaryContact: false,
        ageGroup: 'ADULT',
        guestTags: [],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        invitations: [
          {
            id: 'inv-3',
            weddingId: 'wedding-1',
            guestId: 2,
            eventId: 'event-1',
            rsvp: 'Declined',
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
    gifts: [
      {
        id: 'gift-1',
        householdId: 'household-1',
        eventId: 'event-1',
        weddingId: 'wedding-1',
        thankyou: false,
        description: 'Toaster',
        event: { name: 'Wedding Day' },
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'gift-2',
        householdId: 'household-1',
        eventId: 'event-2',
        weddingId: 'wedding-1',
        thankyou: true,
        description: 'Wine',
        event: { name: 'Welcome Party' },
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
  },
]

const householdsWithSecondFamily: HouseholdWithGuests[] = [
  ...households,
  {
    id: 'household-2',
    weddingId: 'wedding-1',
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    address1: null,
    address2: null,
    city: 'Dallas',
    state: 'TX',
    zipCode: null,
    country: 'US',
    notes: null,
    guests: [
      {
        id: 3,
        firstName: 'Brooke',
        lastName: 'Chen',
        email: 'brooke@example.com',
        phone: null,
        householdId: 'household-2',
        weddingId: 'wedding-1',
        isPrimaryContact: true,
        ageGroup: 'ADULT',
        guestTags: [],
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        invitations: [
          {
            id: 'inv-4',
            weddingId: 'wedding-1',
            guestId: 3,
            eventId: 'event-1',
            rsvp: 'Invited',
            dietaryRestrictions: null,
            submittedBy: null,
            submittedAt: null,
            invitedAt: new Date('2026-01-02T00:00:00.000Z'),
            createdAt: new Date('2026-01-02T00:00:00.000Z'),
            updatedAt: new Date('2026-01-02T00:00:00.000Z'),
          },
        ],
      },
    ],
    gifts: [],
  },
]

const householdsWithFilteredGuests: {
  displayed: HouseholdWithGuests[]
  canonical: HouseholdWithGuests[]
} = {
  displayed: [
    {
      ...households[0],
      guests: households[0].guests.filter((guest) => guest.id !== 4),
    },
  ],
  canonical: [
    {
      ...households[0],
      guests: [
        ...households[0].guests,
        {
          id: 4,
          firstName: 'Taylor',
          lastName: 'Rivera',
          email: null,
          phone: null,
          householdId: 'household-1',
          weddingId: 'wedding-1',
          isPrimaryContact: false,
          ageGroup: 'ADULT',
          guestTags: [],
          createdAt: new Date('2026-01-03T00:00:00.000Z'),
          updatedAt: new Date('2026-01-03T00:00:00.000Z'),
          invitations: [
            {
              id: 'inv-5',
              weddingId: 'wedding-1',
              guestId: 4,
              eventId: 'event-2',
              rsvp: 'Attending',
              dietaryRestrictions: null,
              submittedBy: null,
              submittedAt: null,
              invitedAt: new Date('2026-01-03T00:00:00.000Z'),
              createdAt: new Date('2026-01-03T00:00:00.000Z'),
              updatedAt: new Date('2026-01-03T00:00:00.000Z'),
            },
          ],
        },
      ],
    },
  ],
}

const _TAG_FAMILY_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const _householdsWithCountries: HouseholdWithGuests[] = [
  { ...households[0], country: 'US' },
  {
    ...householdsWithSecondFamily[1],
    country: 'UK',
  },
]

describe('GuestsView', () => {
  beforeEach(() => {
    mockToggleGuestForm.mockReset()
    mockRefresh.mockReset()
    mockHouseholdUpdateMutate.mockReset()
    mockDashboardInvalidate.mockReset()
    shouldMutationFail = false
    deferMutationResolution = false
    pendingMutationSuccess = undefined
    mockTagsData = []
  })

  it('should save canonical household guest party when members modal is saved from a filtered list', async () => {
    render(
      <GuestsView
        events={events}
        households={householdsWithFilteredGuests.displayed}
        allHouseholds={householdsWithFilteredGuests.canonical}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Manage members' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save members' }))

    await waitFor(() => {
      expect(mockHouseholdUpdateMutate).toHaveBeenCalled()
    })

    const payload = mockHouseholdUpdateMutate.mock.calls[0]?.[0] as {
      guestParty: Array<{ guestId: number }>
    }
    expect(payload.guestParty).toHaveLength(3)
    expect(payload.guestParty.map((guest) => guest.guestId)).toEqual([1, 2, 4])
  })

  it('should patch the saved household even if selection changes before mutation resolves', async () => {
    deferMutationResolution = true

    render(
      <GuestsView
        events={events}
        households={householdsWithSecondFamily}
        selectedEventId='all'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit Contact & Address' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'late-success@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    fireEvent.click(screen.getByRole('button', { name: 'Close guest details' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard and close' }))
    fireEvent.click(screen.getByRole('button', { name: /select brooke chen household/i }))

    await act(async () => {
      pendingMutationSuccess?.()
    })

    await waitFor(() => {
      expect(mockDashboardInvalidate).toHaveBeenCalled()
    })

    expect(screen.getByText('brooke@example.com')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close guest details' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard and close' }))
    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    expect(screen.getByText('late-success@example.com')).toBeInTheDocument()
  })

  it('should keep search/filter and add guest while rendering slim cards', () => {
    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='all'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    expect(screen.getByPlaceholderText('Find guests')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter By' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Guest' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /select alex rivera household/i })
    ).toBeInTheDocument()
  })

  it('should show an empty async status when no households match', () => {
    render(
      <GuestsView
        events={events}
        households={[]}
        selectedEventId='all'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    expect(screen.getByRole('status')).toHaveTextContent('No households yet')
  })

  it('should open drawer with section-level edit controls and no full-editor action', () => {
    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))

    expect(screen.getByText('alex@example.com')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Email' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Contact & Address' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Notes' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Continue in Full Editor' })
    ).not.toBeInTheDocument()
  })

  it('should render inline tag input for each member in the modal', () => {
    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Manage members' }))

    expect(screen.getByTestId('Tags for Alex Rivera')).toBeInTheDocument()
  })

  it('should open Manage Household Members modal from Party Members section', () => {
    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Manage members' }))

    expect(screen.getByRole('dialog', { name: 'Manage Household Members' })).toBeInTheDocument()
  })

  it('should keeps drawer draft intact when members modal is saved', async () => {
    render(
      <GuestsView
        events={events}
        households={householdsWithFilteredGuests.displayed}
        allHouseholds={householdsWithFilteredGuests.canonical}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit Contact & Address' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'draft-only@example.com' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Manage members' }))
    fireEvent.click(screen.getByRole('button', { name: /add guest/i }))
    fireEvent.change(screen.getByLabelText('First name (member 3)'), {
      target: { value: 'Taylor' },
    })
    fireEvent.change(screen.getByLabelText('Last name (member 3)'), {
      target: { value: 'Rivera' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save members' }))

    await waitFor(() => {
      expect(screen.getAllByText('Taylor Rivera').length).toBeGreaterThan(0)
    })

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('draft-only@example.com')
  })

  it('should updates drawer party members after adding member in modal and saving', async () => {
    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Manage members' }))

    fireEvent.click(screen.getByRole('button', { name: /add guest/i }))
    fireEvent.change(screen.getByLabelText('First name (member 3)'), {
      target: { value: 'Taylor' },
    })
    fireEvent.change(screen.getByLabelText('Last name (member 3)'), {
      target: { value: 'Rivera' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save members' }))

    await waitFor(() => {
      expect(screen.getAllByText('Taylor Rivera').length).toBeGreaterThan(0)
    })
  })

  it('should keep modal open and preserve draft values when member save fails', async () => {
    shouldMutationFail = true

    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Manage members' }))

    fireEvent.click(screen.getByRole('button', { name: /add guest/i }))
    fireEvent.change(screen.getByLabelText('First name (member 3)'), {
      target: { value: 'Taylor' },
    })
    fireEvent.change(screen.getByLabelText('Last name (member 3)'), {
      target: { value: 'Rivera' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save members' }))

    await waitFor(() => {
      expect(mockHouseholdUpdateMutate).toHaveBeenCalled()
    })

    expect(screen.getByRole('dialog', { name: 'Manage Household Members' })).toBeInTheDocument()
    expect(screen.getByLabelText('First name (member 3)')).toHaveValue('Taylor')
    expect(screen.getByLabelText('Last name (member 3)')).toHaveValue('Rivera')
    await waitFor(() => {
      expect(screen.getByText('Unable to save members. Please try again.')).toBeInTheDocument()
    })
  })

  it('should block member save when required names are missing', () => {
    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Manage members' }))
    fireEvent.click(screen.getByRole('button', { name: /add guest/i }))

    expect(
      screen.getByText('Each household member must include a first and last name.')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Save members' }))

    expect(mockHouseholdUpdateMutate).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Manage Household Members' })).toBeInTheDocument()
  })

  it('should show remove disabled for current primary until another member is primary', () => {
    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Manage members' }))

    expect(screen.getByRole('button', { name: 'Remove Alex Rivera' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Set Jamie Rivera as primary' }))
    expect(screen.getByRole('button', { name: 'Remove Alex Rivera' })).toBeEnabled()
  })

  it('should show dirty actions and save updated values in drawer', async () => {
    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit Contact & Address' }))

    const emailInput = screen.getByRole('textbox', { name: 'Email' })
    fireEvent.change(emailInput, { target: { value: 'updated@example.com' } })

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(mockHouseholdUpdateMutate).toHaveBeenCalled()
      expect(mockDashboardInvalidate).toHaveBeenCalled()
    })

    expect(screen.queryByRole('textbox', { name: 'Email' })).not.toBeInTheDocument()
    expect(screen.getByText('updated@example.com')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
  })

  it('should discard dirty changes and restore baseline values', () => {
    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit Notes' }))

    fireEvent.change(screen.getByPlaceholderText('No notes yet'), {
      target: { value: 'Bring high chair' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))

    expect(screen.queryByRole('textbox', { name: 'Email' })).not.toBeInTheDocument()
    expect(screen.getByText('Vegetarian meals only')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
  })

  it('should preserve dirty draft when save fails', () => {
    shouldMutationFail = true

    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit Contact & Address' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'failed-save@example.com' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('failed-save@example.com')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  })

  it('should guard closing when there are unsaved changes', () => {
    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit Notes' }))
    fireEvent.change(screen.getByPlaceholderText('No notes yet'), {
      target: { value: 'Unsaved text' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Close guest details' }))

    expect(screen.getByText('Discard unsaved changes?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep editing' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Discard and close' })).toBeInTheDocument()
  })

  it('should include a link to manage RSVPs in events page', () => {
    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))

    const manageLink = screen.getByRole('link', { name: 'Manage RSVPs in Events' })
    expect(manageLink).toHaveAttribute('href', '/events?eventId=event-1&tab=rsvps')
  })

  it('should reset drawer values when drawer is discarded and closed', () => {
    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit Contact & Address' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'temp@example.com' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Close guest details' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard and close' }))

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    expect(screen.queryByRole('textbox', { name: 'Email' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Edit Contact & Address' }))
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('alex@example.com')
  })

  it('should open another household in display mode with fresh values after closing edit', () => {
    render(
      <GuestsView
        events={events}
        households={householdsWithSecondFamily}
        selectedEventId='all'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit Contact & Address' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'temp@example.com' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Close guest details' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard and close' }))
    fireEvent.click(screen.getByRole('button', { name: /select brooke chen household/i }))

    expect(screen.queryByRole('textbox', { name: 'Email' })).not.toBeInTheDocument()
    expect(screen.getByText('brooke@example.com')).toBeInTheDocument()
  })

  it('should show mixed RSVP state in all-events mode for guests with mixed responses', () => {
    const householdsWithMixedRsvp: HouseholdWithGuests[] = [
      {
        ...households[0],
        guests: [
          {
            ...households[0].guests[0],
            invitations: [
              {
                ...households[0].guests[0].invitations[0],
                rsvp: 'Attending',
              },
              {
                ...households[0].guests[0].invitations[1],
                rsvp: 'Declined',
              },
            ],
          },
        ],
      },
    ]

    render(
      <GuestsView
        events={events}
        households={householdsWithMixedRsvp}
        selectedEventId='all'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))

    expect(screen.getByText('Mixed')).toBeInTheDocument()
  })

  it('should show known and missing household details in drawer', () => {
    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))

    expect(screen.getByText('Contact & Address')).toBeInTheDocument()
    expect(screen.getByText('alex@example.com')).toBeInTheDocument()
    expect(screen.getByText('555-1111')).toBeInTheDocument()
    expect(screen.getByText('123 Main St, Austin, TX, 73301, US')).toBeInTheDocument()
  })

  it('should render an accessible event edit button in selected event header', () => {
    const setPrefillEvent = jest.fn()

    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={setPrefillEvent}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit event details' }))

    expect(setPrefillEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'event-1',
        eventName: 'Wedding Day',
      })
    )
  })

  it('should filter households by first name', () => {
    render(
      <GuestsView
        events={events}
        households={householdsWithSecondFamily}
        selectedEventId='all'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Find guests'), { target: { value: 'Brooke' } })

    expect(
      screen.queryByRole('button', { name: /select alex rivera household/i })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /select brooke chen household/i })
    ).toBeInTheDocument()
  })

  it('should filter households by last name', () => {
    render(
      <GuestsView
        events={events}
        households={householdsWithSecondFamily}
        selectedEventId='all'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Find guests'), { target: { value: 'Chen' } })

    expect(
      screen.queryByRole('button', { name: /select alex rivera household/i })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /select brooke chen household/i })
    ).toBeInTheDocument()
  })

  it('should filter households by full name', () => {
    render(
      <GuestsView
        events={events}
        households={householdsWithSecondFamily}
        selectedEventId='all'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Find guests'), {
      target: { value: 'Alex Rivera' },
    })

    expect(
      screen.getByRole('button', { name: /select alex rivera household/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /select brooke chen household/i })
    ).not.toBeInTheDocument()
  })

  it('should filter guests case-insensitively', () => {
    render(
      <GuestsView
        events={events}
        households={householdsWithSecondFamily}
        selectedEventId='all'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Find guests'), { target: { value: 'alex' } })

    expect(
      screen.getByRole('button', { name: /select alex rivera household/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /select brooke chen household/i })
    ).not.toBeInTheDocument()
  })

  it('should sort households by name and reset to default order', () => {
    render(
      <GuestsView
        events={events}
        households={householdsWithSecondFamily}
        selectedEventId='all'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
        onImportClick={jest.fn()}
      />
    )

    const householdButtons = () =>
      screen
        .getAllByRole('button', { name: /select .* household/i })
        .map((node) => node.textContent)

    expect(householdButtons()[0]).toContain('Alex Rivera')

    fireEvent.click(screen.getByRole('button', { name: 'Sort by Name' }))
    expect(householdButtons()[0]).toContain('Alex Rivera')

    fireEvent.click(screen.getByRole('button', { name: 'Sort by Name' }))
    expect(householdButtons()[0]).toContain('Brooke Chen')

    fireEvent.click(screen.getByRole('button', { name: 'Sort by Name' }))
    expect(householdButtons()[0]).toContain('Alex Rivera')
  })
})
