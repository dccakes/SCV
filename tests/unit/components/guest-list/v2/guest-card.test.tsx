import { fireEvent, render, screen } from '@testing-library/react'

import { GuestCard } from '~/components/guest-list/v2/list/guest-card'
import type { HouseholdWithGuests } from '~/server/application/dashboard/dashboard.types'

const mockHousehold: HouseholdWithGuests = {
  id: 'household-1',
  weddingId: 'wedding-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  address1: null,
  address2: null,
  city: 'Austin',
  state: 'TX',
  zipCode: null,
  country: 'USA',
  notes: null,
  guests: [
    {
      id: 1,
      firstName: 'Alex',
      lastName: 'Rivera',
      email: 'alex@example.com',
      phone: null,
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
          rsvp: 'Attending',
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
          id: 'inv-2',
          weddingId: 'wedding-1',
          guestId: 2,
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
}

const mockHouseholdWithTagAlong: HouseholdWithGuests = {
  ...mockHousehold,
  guests: [
    mockHousehold.guests[0]!, // Regular guest: Attending
    {
      ...mockHousehold.guests[1]!,
      id: 3,
      firstName: 'Baby',
      lastName: 'Rivera',
      isTagAlong: true,
      invitations: [
        {
          id: 'inv-3',
          weddingId: 'wedding-1',
          guestId: 3,
          eventId: 'event-1',
          rsvp: 'Attending',
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
}

const mockHouseholdTagAlongNoInvitations: HouseholdWithGuests = {
  ...mockHousehold,
  guests: [
    mockHousehold.guests[0]!, // Regular guest: Attending
    {
      ...mockHousehold.guests[1]!,
      id: 4,
      firstName: 'Toddler',
      lastName: 'Rivera',
      isTagAlong: true,
      invitations: [], // No invitations (event doesn't allow tag-alongs)
    },
  ],
}

describe('GuestCard', () => {
  it('should render polished identity, location, and summary details', () => {
    render(<GuestCard household={mockHousehold} onSelectHousehold={jest.fn()} />)

    expect(screen.getByText('Alex Rivera +1')).toBeInTheDocument()
    expect(screen.getAllByText('AR').length).toBeGreaterThan(0)
    expect(screen.getByText('Austin, TX, USA')).toBeInTheDocument()
    expect(screen.getByText('Party of 2')).toBeInTheDocument()
    expect(screen.getByText('1 attending')).toBeInTheDocument()
    expect(screen.getByText('1 invited')).toBeInTheDocument()
  })

  it('uses selected styling when card is active', () => {
    render(<GuestCard household={mockHousehold} onSelectHousehold={jest.fn()} isSelected />)

    expect(screen.getByLabelText(/select alex rivera household/i).firstElementChild).toHaveClass(
      'ring-1',
      'ring-primary/30'
    )
  })

  it('should call selection callback with household id', () => {
    const onSelectHousehold = jest.fn()

    render(<GuestCard household={mockHousehold} onSelectHousehold={onSelectHousehold} />)

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))

    expect(onSelectHousehold).toHaveBeenCalledWith(expect.objectContaining({ id: 'household-1' }))
  })

  it('should include tag-along invitations in RSVP summary', () => {
    render(<GuestCard household={mockHouseholdWithTagAlong} onSelectHousehold={jest.fn()} />)

    // Both regular guest and tag-along are "Attending"
    expect(screen.getByText('2 attending')).toBeInTheDocument()
  })

  it('should not count tag-alongs without invitations in RSVP summary', () => {
    render(
      <GuestCard household={mockHouseholdTagAlongNoInvitations} onSelectHousehold={jest.fn()} />
    )

    // Only the regular guest has invitations
    expect(screen.getByText('1 attending')).toBeInTheDocument()
  })
})
