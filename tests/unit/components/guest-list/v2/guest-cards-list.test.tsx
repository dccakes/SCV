import { fireEvent, render, screen } from '@testing-library/react'

import { GuestCardsList } from '~/components/guest-list/v2/list/guest-cards-list'
import type { HouseholdWithGuests } from '~/server/application/dashboard/dashboard.types'

const buildHousehold = (
  id: string,
  firstName: string,
  lastName: string,
  rsvp: string
): HouseholdWithGuests => ({
  id,
  weddingId: 'wedding-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  address1: null,
  address2: null,
  city: null,
  state: null,
  zipCode: null,
  country: null,
  notes: null,
  guests: [
    {
      id: 1,
      firstName,
      lastName,
      email: null,
      phone: null,
      householdId: id,
      weddingId: 'wedding-1',
      isPrimaryContact: true,
      ageGroup: 'ADULT',
      guestTags: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      invitations: [
        {
          id: `inv-${id}`,
          weddingId: 'wedding-1',
          guestId: 1,
          eventId: 'event-1',
          rsvp,
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
})

describe('GuestCardsList', () => {
  it('should render guest cards for all households', () => {
    const households = [
      buildHousehold('household-1', 'Alex', 'Rivera', 'Attending'),
      buildHousehold('household-2', 'Jordan', 'Lee', 'Declined'),
    ]

    render(<GuestCardsList households={households} onSelectHousehold={jest.fn()} />)

    expect(screen.getByText('Alex Rivera')).toBeInTheDocument()
    expect(screen.getByText('Jordan Lee')).toBeInTheDocument()
  })

  it('should call onSelectHousehold when a card is selected', () => {
    const onSelectHousehold = jest.fn()
    const households = [buildHousehold('household-1', 'Alex', 'Rivera', 'Attending')]

    render(<GuestCardsList households={households} onSelectHousehold={onSelectHousehold} />)

    fireEvent.click(screen.getByRole('button', { name: /select alex rivera household/i }))

    expect(onSelectHousehold).toHaveBeenCalledWith(expect.objectContaining({ id: 'household-1' }))
  })

  it('should show empty state when there are no households', () => {
    render(<GuestCardsList households={[]} onSelectHousehold={jest.fn()} />)

    expect(screen.getByText('No households yet')).toBeInTheDocument()
  })
})
