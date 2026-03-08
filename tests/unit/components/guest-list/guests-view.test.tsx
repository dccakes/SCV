import { fireEvent, render, screen } from '@testing-library/react'
import GuestsView from '~/components/guest-list/guests-view'
import type { HouseholdWithGuests } from '~/server/application/dashboard/dashboard.types'

const mockToggleGuestForm = jest.fn()

jest.mock('~/components/contexts/guest-form-context', () => ({
  useToggleGuestForm: () => mockToggleGuestForm,
}))

jest.mock('~/components/contexts/event-form-context', () => ({
  useToggleEventForm: () => jest.fn(),
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

describe('GuestsView', () => {
  beforeEach(() => {
    mockToggleGuestForm.mockReset()
  })

  it('should keep search/filter and add guest while rendering slim cards', () => {
    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='all'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
      />
    )

    expect(screen.getByPlaceholderText('Find Guests')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter By' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Guest' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /select alex rivera household/i })
    ).toBeInTheDocument()
  })

  it('should open drawer and edit selected household with existing prefill flow', () => {
    const setPrefillHousehold = jest.fn()
    const setPrefillEvent = jest.fn()

    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={setPrefillHousehold}
        setPrefillEvent={setPrefillEvent}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))

    expect(screen.getByRole('dialog')).toHaveClass('h-screen')
    expect(screen.getByRole('button', { name: 'Close guest details' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Open Full Editor' }))

    expect(setPrefillHousehold).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId: 'household-1',
        guestParty: expect.arrayContaining([
          expect.objectContaining({
            firstName: 'Alex',
            invites: expect.objectContaining({ 'event-1': 'Attending' }),
          }),
        ]),
        gifts: expect.arrayContaining([expect.objectContaining({ eventId: 'event-1' })]),
      })
    )
    expect(setPrefillEvent).not.toHaveBeenCalled()
    expect(mockToggleGuestForm).toHaveBeenCalled()
  })

  it('should show known and missing household details in drawer', () => {
    render(
      <GuestsView
        events={events}
        households={households}
        selectedEventId='event-1'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
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

  it('should sort households by name and reset to default order', () => {
    render(
      <GuestsView
        events={events}
        households={householdsWithSecondFamily}
        selectedEventId='all'
        setPrefillHousehold={jest.fn()}
        setPrefillEvent={jest.fn()}
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
