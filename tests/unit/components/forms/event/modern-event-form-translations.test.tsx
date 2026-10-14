import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { ModernEventForm } from '~/components/forms/event/modern-event-form'
import type { Event } from '~/server/domains/event/event.types'

const event: Event = {
  id: 'event-1',
  name: 'Welcome Dinner',
  date: null,
  startTime: null,
  endTime: null,
  venue: 'Casa Reyna',
  attire: null,
  description: null,
  translations: { es: { name: 'Cena de bienvenida' } },
  weddingId: 'w',
  collectRsvp: false,
  allowTagAlongs: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('ModernEventForm Spanish text', () => {
  it('switches the text boxes to Spanish and submits both languages', async () => {
    const onSubmit = jest.fn()
    render(
      <ModernEventForm
        mode='edit'
        event={event}
        open
        onOpenChange={jest.fn()}
        onSubmit={onSubmit}
      />
    )

    expect(screen.getByLabelText(/Event Name/)).toHaveValue('Welcome Dinner')
    fireEvent.click(screen.getByRole('radio', { name: 'Spanish' }))

    expect(screen.getByLabelText(/Event Name/)).toHaveValue('Cena de bienvenida')
    const venue = screen.getByLabelText('Venue')
    expect(venue).toHaveValue('')
    expect(venue).toHaveAttribute('placeholder', 'Casa Reyna')

    fireEvent.change(venue, { target: { value: 'Casa Reyna (centro)' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update Event' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      eventName: 'Welcome Dinner',
      venue: 'Casa Reyna',
      translations: { es: { name: 'Cena de bienvenida', venue: 'Casa Reyna (centro)' } },
    })
  })
})
