import { fireEvent, render, screen } from '@testing-library/react'

import EventForm from '~/components/forms/event-form'

const mockUpdateEvent = jest.fn()

jest.mock('~/components/contexts/event-form-context', () => ({
  useToggleEventForm: () => jest.fn(),
}))

jest.mock('~/components/hooks/forms/useEventFormActions', () => ({
  useEventFormActions: () => ({
    createEvent: jest.fn(),
    isCreatingEvent: false,
    updateEvent: mockUpdateEvent,
    isUpdatingEvent: false,
    deleteEvent: jest.fn(),
    isDeletingEvent: false,
  }),
}))

jest.mock('~/components/forms/event/date-input', () => () => <div>Date Input</div>)
jest.mock('~/components/forms/event/time-selections', () => () => <div>Time Selections</div>)

describe('legacy EventForm Spanish text', () => {
  it('edits the Spanish name alongside the English event', () => {
    render(
      <EventForm
        prefillFormData={{
          eventName: 'Welcome Dinner',
          date: undefined,
          startTime: undefined,
          endTime: undefined,
          venue: 'Casa Reyna',
          attire: undefined,
          description: undefined,
          eventId: 'event-1',
          translations: { es: { venue: 'Casa Reyna' } },
        }}
      />
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Spanish' }))
    expect(screen.getByText('Welcome Dinner')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Nombre del evento'), {
      target: { value: 'Cena de bienvenida' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save & Close' }))

    expect(mockUpdateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'Welcome Dinner',
        translations: { es: { venue: 'Casa Reyna', name: 'Cena de bienvenida' } },
      })
    )
  })
})
