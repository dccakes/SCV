import { fireEvent, render, screen } from '@testing-library/react'

import { EventCard } from '~/app/(authenicated)/events/_components/event-card'
import type { EventWithStats } from '~/server/domains/event/event.types'

const mockEvent: EventWithStats = {
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
  guestResponses: {
    attending: 10,
    invited: 5,
    declined: 2,
    notInvited: 3,
  },
}

describe('EventCard', () => {
  it('renders event info and manage guests button', () => {
    const onEdit = jest.fn()
    const onDelete = jest.fn()
    const onManageGuests = jest.fn()

    render(
      <EventCard
        event={mockEvent}
        onEdit={onEdit}
        onDelete={onDelete}
        onManageGuests={onManageGuests}
      />
    )

    expect(screen.getByText('Ceremony')).toBeInTheDocument()
    expect(screen.getByText('Main Hall')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /manage guests|guests/i }))
    expect(onManageGuests).toHaveBeenCalledWith('evt-1')
  })

  it('always shows guest count regardless of collectRsvp', () => {
    const noRsvpEvent: EventWithStats = {
      ...mockEvent,
      collectRsvp: false,
    }

    render(
      <EventCard
        event={noRsvpEvent}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onManageGuests={jest.fn()}
      />
    )

    expect(screen.getByText(/17 of 20 guests invited/)).toBeInTheDocument()
  })

  it('renders the actions dropdown trigger', () => {
    render(
      <EventCard
        event={mockEvent}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onManageGuests={jest.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /event actions/i })).toBeInTheDocument()
  })
})
