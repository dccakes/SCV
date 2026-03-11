import { fireEvent, render, screen } from '@testing-library/react'

import EventForm from '~/components/forms/event-form'

const mockToggleEventForm = jest.fn()

jest.mock('~/components/contexts/event-form-context', () => ({
  useToggleEventForm: () => mockToggleEventForm,
}))

jest.mock('~/components/hooks/forms/useEventFormActions', () => ({
  useEventFormActions: () => ({
    createEvent: jest.fn(),
    isCreatingEvent: false,
    updateEvent: jest.fn(),
    isUpdatingEvent: false,
    deleteEvent: jest.fn(),
    isDeletingEvent: false,
  }),
}))

jest.mock('~/components/forms/animated-input-label', () => {
  return function MockAnimatedInputLabel() {
    return <div>Field</div>
  }
})

jest.mock('~/components/forms/event/date-input', () => {
  return function MockDateInput() {
    return <div>Date Input</div>
  }
})

jest.mock('~/components/forms/event/time-selections', () => {
  return function MockTimeSelections() {
    return <div>Time Selections</div>
  }
})

describe('EventForm accessibility', () => {
  beforeEach(() => {
    mockToggleEventForm.mockReset()
  })

  it('should render a semantic close button with accessible name', () => {
    render(<EventForm prefillFormData={undefined} />)

    const closeButton = screen.getByRole('button', { name: 'Close event form' })
    expect(closeButton).toHaveAttribute('type', 'button')

    fireEvent.click(closeButton)

    expect(mockToggleEventForm).toHaveBeenCalledTimes(1)
  })
})
