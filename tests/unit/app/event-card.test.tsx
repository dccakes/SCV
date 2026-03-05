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
    notInvited: 0,
  },
}

describe('EventCard', () => {
  it('renders event info and calls callbacks with event id', () => {
    const onEdit = jest.fn()
    const onDelete = jest.fn()

    render(<EventCard event={mockEvent} onEdit={onEdit} onDelete={onDelete} />)

    expect(screen.getByText('Ceremony')).toBeInTheDocument()
    expect(screen.getByText('Main Hall')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    expect(onEdit).toHaveBeenCalledWith('evt-1')
    expect(onDelete).toHaveBeenCalledWith('evt-1')
  })
})
