/**
 * Tests for Event Form - Critical Form Behaviors
 *
 * Tests that verify:
 * 1. Form can successfully create events with valid data
 * 2. Form pre-populates correctly when editing an existing event
 * 3. Form validation prevents invalid submissions
 * 4. Form transformation converts empty strings to undefined for optional fields
 */

import { zodResolver } from '@hookform/resolvers/zod'
import { act, renderHook } from '@testing-library/react'
import { useForm } from 'react-hook-form'

import {
  type EventFormData,
  EventFormSchema,
  getEventFormDefaults,
  transformToServerInput,
} from '~/app/_components/forms/event/event-form.schema'
import { type Event } from '~/server/domains/event/event.types'

// Mock event for edit mode tests - use a future date
const createMockEventDate = () => {
  const futureDate = new Date()
  futureDate.setFullYear(futureDate.getFullYear() + 1)
  return futureDate
}

const mockEvent: Event = {
  id: 'event-123',
  name: 'Wedding Ceremony',
  date: createMockEventDate(),
  startTime: '14:00',
  endTime: '16:00',
  venue: 'Grand Plaza Hotel',
  attire: 'Black Tie',
  description: 'Join us for our wedding ceremony',
  collectRsvp: true,
  weddingId: 'wedding-123',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('EventForm - Create Event', () => {
  it('should create event with all fields populated', async () => {
    const { result } = renderHook(() => {
      const form = useForm<EventFormData>({
        mode: 'onChange',
        resolver: zodResolver(EventFormSchema),
        defaultValues: getEventFormDefaults(),
      })
      // Subscribe to formState to enable dirty tracking
      void form.formState.isDirty
      return form
    })

    // Use a future date
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    const futureDateString = futureDate.toISOString().split('T')[0]!

    // Fill in all form fields
    act(() => {
      result.current.setValue('eventName', 'Reception', { shouldDirty: true })
      result.current.setValue('date', futureDateString, { shouldDirty: true })
      result.current.setValue('startTime', '18:00', { shouldDirty: true })
      result.current.setValue('endTime', '23:00', { shouldDirty: true })
      result.current.setValue('venue', 'Seaside Pavilion', { shouldDirty: true })
      result.current.setValue('attire', 'Cocktail Attire', { shouldDirty: true })
      result.current.setValue('description', 'Dance the night away', { shouldDirty: true })
    })

    // Trigger validation
    const isValid = await act(async () => {
      return await result.current.trigger()
    })

    expect(isValid).toBe(true)
    expect(result.current.formState.errors).toEqual({})
    expect(result.current.formState.isDirty).toBe(true)

    const data = result.current.getValues()
    expect(data.eventName).toBe('Reception')
    expect(data.date).toBe(futureDateString)
    expect(data.startTime).toBe('18:00')
    expect(data.endTime).toBe('23:00')
    expect(data.venue).toBe('Seaside Pavilion')
    expect(data.attire).toBe('Cocktail Attire')
    expect(data.description).toBe('Dance the night away')
  })

  it('should create event with only required fields', async () => {
    const { result } = renderHook(() =>
      useForm<EventFormData>({
        resolver: zodResolver(EventFormSchema),
        defaultValues: getEventFormDefaults(),
      })
    )

    // Only fill in required field (eventName)
    act(() => {
      result.current.setValue('eventName', 'Rehearsal Dinner', { shouldDirty: true })
    })

    // Trigger validation
    const isValid = await act(async () => {
      return await result.current.trigger()
    })

    expect(isValid).toBe(true)
    expect(result.current.formState.errors).toEqual({})

    const data = result.current.getValues()
    expect(data.eventName).toBe('Rehearsal Dinner')
    expect(data.date).toBe('')
    expect(data.startTime).toBe('')
    expect(data.endTime).toBe('')
    expect(data.venue).toBe('')
    expect(data.attire).toBe('')
    expect(data.description).toBe('')
  })

  it('should reject submission without event name', async () => {
    const { result } = renderHook(() => {
      const form = useForm<EventFormData>({
        resolver: zodResolver(EventFormSchema),
        defaultValues: getEventFormDefaults(),
      })
      // Subscribe to errors
      void form.formState.errors
      return form
    })

    // Trigger validation without filling event name
    const isValid = await act(async () => {
      return await result.current.trigger()
    })

    expect(isValid).toBe(false)
    expect(result.current.formState.errors).toHaveProperty('eventName')
    expect(result.current.formState.errors.eventName?.message).toBeTruthy()
  })

  it('should reject event name longer than 50 characters', async () => {
    const { result } = renderHook(() => {
      const form = useForm<EventFormData>({
        resolver: zodResolver(EventFormSchema),
        defaultValues: getEventFormDefaults(),
      })
      void form.formState.errors
      return form
    })

    // Event name with 51 characters (exceeds limit)
    act(() => {
      result.current.setValue(
        'eventName',
        'A'.repeat(51),
        { shouldDirty: true }
      )
    })

    const isValid = await act(async () => {
      return await result.current.trigger()
    })

    expect(isValid).toBe(false)
    expect(result.current.formState.errors).toHaveProperty('eventName')
    expect(result.current.formState.errors.eventName?.message).toBe(
      'Event name must be 50 characters or less'
    )
  })

  it('should accept event name with exactly 50 characters', async () => {
    const { result } = renderHook(() => {
      const form = useForm<EventFormData>({
        resolver: zodResolver(EventFormSchema),
        defaultValues: getEventFormDefaults(),
      })
      void form.formState.errors
      return form
    })

    // Event name with exactly 50 characters
    act(() => {
      result.current.setValue(
        'eventName',
        'A'.repeat(50),
        { shouldDirty: true }
      )
    })

    const isValid = await act(async () => {
      return await result.current.trigger()
    })

    expect(isValid).toBe(true)
    expect(result.current.formState.errors).toEqual({})
  })
})

describe('EventForm - Edit Event', () => {
  it('should pre-populate form with event data', () => {
    const eventDateString = mockEvent.date
      ? new Date(mockEvent.date).toISOString().split('T')[0]
      : ''

    const { result } = renderHook(() =>
      useForm<EventFormData>({
        resolver: zodResolver(EventFormSchema),
        defaultValues: {
          eventName: mockEvent.name,
          date: eventDateString,
          startTime: mockEvent.startTime ?? '',
          endTime: mockEvent.endTime ?? '',
          venue: mockEvent.venue ?? '',
          attire: mockEvent.attire ?? '',
          description: mockEvent.description ?? '',
        },
      })
    )

    const data = result.current.getValues()
    expect(data.eventName).toBe('Wedding Ceremony')
    expect(data.date).toBe(eventDateString)
    expect(data.startTime).toBe('14:00')
    expect(data.endTime).toBe('16:00')
    expect(data.venue).toBe('Grand Plaza Hotel')
    expect(data.attire).toBe('Black Tie')
    expect(data.description).toBe('Join us for our wedding ceremony')
  })

  it('should track changes when editing event', async () => {
    const eventDateString = mockEvent.date
      ? new Date(mockEvent.date).toISOString().split('T')[0]
      : ''

    const { result } = renderHook(() =>
      useForm<EventFormData>({
        mode: 'onChange',
        resolver: zodResolver(EventFormSchema),
        defaultValues: {
          eventName: mockEvent.name,
          date: eventDateString,
          startTime: mockEvent.startTime ?? '',
          endTime: mockEvent.endTime ?? '',
          venue: mockEvent.venue ?? '',
          attire: mockEvent.attire ?? '',
          description: mockEvent.description ?? '',
        },
      })
    )

    // Form should not be dirty initially
    expect(result.current.formState.isDirty).toBe(false)

    // Change only the venue
    act(() => {
      result.current.setValue('venue', 'New Venue Location', { shouldDirty: true })
    })

    const dirtyFields = result.current.formState.dirtyFields
    expect(dirtyFields.venue).toBe(true)
    expect(dirtyFields.eventName).toBeUndefined()
    expect(result.current.formState.isDirty).toBe(true)

    // Verify changed value
    const data = result.current.getValues()
    expect(data.venue).toBe('New Venue Location')
    expect(data.eventName).toBe('Wedding Ceremony') // Unchanged
  })

  it('should handle editing event with null optional fields', () => {
    const minimalEvent: Event = {
      id: 'event-456',
      name: 'Simple Event',
      date: null,
      startTime: null,
      endTime: null,
      venue: null,
      attire: null,
      description: null,
      collectRsvp: false,
      weddingId: 'wedding-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const { result } = renderHook(() =>
      useForm<EventFormData>({
        resolver: zodResolver(EventFormSchema),
        defaultValues: {
          eventName: minimalEvent.name,
          date: minimalEvent.date ? '' : '',
          startTime: minimalEvent.startTime ?? '',
          endTime: minimalEvent.endTime ?? '',
          venue: minimalEvent.venue ?? '',
          attire: minimalEvent.attire ?? '',
          description: minimalEvent.description ?? '',
        },
      })
    )

    const data = result.current.getValues()
    expect(data.eventName).toBe('Simple Event')
    expect(data.date).toBe('')
    expect(data.startTime).toBe('')
    expect(data.endTime).toBe('')
    expect(data.venue).toBe('')
    expect(data.attire).toBe('')
    expect(data.description).toBe('')
  })
})

describe('EventForm - Data Transformation', () => {
  it('should transform empty strings to undefined for optional fields', () => {
    const formData: EventFormData = {
      eventName: 'Wedding Day',
      date: '',
      startTime: '',
      endTime: '',
      venue: '',
      attire: '',
      description: '',
    }

    const serverInput = transformToServerInput(formData)

    expect(serverInput.eventName).toBe('Wedding Day')
    expect(serverInput.date).toBeUndefined()
    expect(serverInput.startTime).toBeUndefined()
    expect(serverInput.endTime).toBeUndefined()
    expect(serverInput.venue).toBeUndefined()
    expect(serverInput.attire).toBeUndefined()
    expect(serverInput.description).toBeUndefined()
  })

  it('should preserve non-empty optional field values', () => {
    const formData: EventFormData = {
      eventName: 'Reception',
      date: '2025-06-15',
      startTime: '18:00',
      endTime: '23:00',
      venue: 'Grand Ballroom',
      attire: 'Black Tie',
      description: 'Evening celebration',
    }

    const serverInput = transformToServerInput(formData)

    expect(serverInput.eventName).toBe('Reception')
    expect(serverInput.date).toBe('2025-06-15')
    expect(serverInput.startTime).toBe('18:00')
    expect(serverInput.endTime).toBe('23:00')
    expect(serverInput.venue).toBe('Grand Ballroom')
    expect(serverInput.attire).toBe('Black Tie')
    expect(serverInput.description).toBe('Evening celebration')
  })

  it('should handle mixed empty and filled optional fields', () => {
    const formData: EventFormData = {
      eventName: 'Brunch',
      date: '2025-06-16',
      startTime: '11:00',
      endTime: '',
      venue: 'Garden Terrace',
      attire: '',
      description: '',
    }

    const serverInput = transformToServerInput(formData)

    expect(serverInput.eventName).toBe('Brunch')
    expect(serverInput.date).toBe('2025-06-16')
    expect(serverInput.startTime).toBe('11:00')
    expect(serverInput.endTime).toBeUndefined()
    expect(serverInput.venue).toBe('Garden Terrace')
    expect(serverInput.attire).toBeUndefined()
    expect(serverInput.description).toBeUndefined()
  })
})

describe('EventForm - Field Validation', () => {
  it('should accept future date', async () => {
    const { result } = renderHook(() => {
      const form = useForm<EventFormData>({
        resolver: zodResolver(EventFormSchema),
        defaultValues: getEventFormDefaults(),
      })
      void form.formState.errors
      return form
    })

    // Use a date far in the future
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    const futureDateString = futureDate.toISOString().split('T')[0]

    act(() => {
      result.current.setValue('eventName', 'Wedding', { shouldDirty: true })
      result.current.setValue('date', futureDateString, { shouldDirty: true })
    })

    const isValid = await act(async () => {
      return await result.current.trigger()
    })

    expect(isValid).toBe(true)
    expect(result.current.formState.errors).toEqual({})
  })

  it('should accept today as event date', async () => {
    const { result } = renderHook(() => {
      const form = useForm<EventFormData>({
        resolver: zodResolver(EventFormSchema),
        defaultValues: getEventFormDefaults(),
      })
      void form.formState.errors
      return form
    })

    // Use today's date
    const today = new Date()
    const todayString = today.toISOString().split('T')[0]

    act(() => {
      result.current.setValue('eventName', 'Wedding', { shouldDirty: true })
      result.current.setValue('date', todayString, { shouldDirty: true })
    })

    const isValid = await act(async () => {
      return await result.current.trigger()
    })

    expect(isValid).toBe(true)
    expect(result.current.formState.errors).toEqual({})
  })

  it('should reject past date', async () => {
    const { result } = renderHook(() => {
      const form = useForm<EventFormData>({
        resolver: zodResolver(EventFormSchema),
        defaultValues: getEventFormDefaults(),
      })
      void form.formState.errors
      return form
    })

    // Use a date in the past
    act(() => {
      result.current.setValue('eventName', 'Wedding', { shouldDirty: true })
      result.current.setValue('date', '2020-01-01', { shouldDirty: true })
    })

    const isValid = await act(async () => {
      return await result.current.trigger()
    })

    expect(isValid).toBe(false)
    expect(result.current.formState.errors).toHaveProperty('date')
    expect(result.current.formState.errors.date?.message).toBe('Event date cannot be in the past')
  })

  it('should accept empty date string', async () => {
    const { result } = renderHook(() => {
      const form = useForm<EventFormData>({
        resolver: zodResolver(EventFormSchema),
        defaultValues: getEventFormDefaults(),
      })
      void form.formState.errors
      return form
    })

    act(() => {
      result.current.setValue('eventName', 'Wedding', { shouldDirty: true })
      result.current.setValue('date', '', { shouldDirty: true })
    })

    const isValid = await act(async () => {
      return await result.current.trigger()
    })

    // Empty date is optional and should be valid
    expect(isValid).toBe(true)
    expect(result.current.formState.errors).toEqual({})
  })

  it('should accept valid time string', async () => {
    const { result } = renderHook(() => {
      const form = useForm<EventFormData>({
        resolver: zodResolver(EventFormSchema),
        defaultValues: getEventFormDefaults(),
      })
      void form.formState.errors
      return form
    })

    act(() => {
      result.current.setValue('eventName', 'Wedding', { shouldDirty: true })
      result.current.setValue('startTime', '14:00', { shouldDirty: true })
      result.current.setValue('endTime', '16:00', { shouldDirty: true })
    })

    const isValid = await act(async () => {
      return await result.current.trigger()
    })

    expect(isValid).toBe(true)
    expect(result.current.formState.errors).toEqual({})
  })

  it('should accept long venue names', async () => {
    const { result } = renderHook(() => {
      const form = useForm<EventFormData>({
        resolver: zodResolver(EventFormSchema),
        defaultValues: getEventFormDefaults(),
      })
      void form.formState.errors
      return form
    })

    act(() => {
      result.current.setValue('eventName', 'Wedding', { shouldDirty: true })
      result.current.setValue('venue', 'A'.repeat(300), { shouldDirty: true })
    })

    const isValid = await act(async () => {
      return await result.current.trigger()
    })

    // Schema has no max length validation
    expect(isValid).toBe(true)
    expect(result.current.formState.errors).toEqual({})
  })

  it('should accept long descriptions', async () => {
    const { result } = renderHook(() => {
      const form = useForm<EventFormData>({
        resolver: zodResolver(EventFormSchema),
        defaultValues: getEventFormDefaults(),
      })
      void form.formState.errors
      return form
    })

    act(() => {
      result.current.setValue('eventName', 'Wedding', { shouldDirty: true })
      result.current.setValue('description', 'A'.repeat(2000), { shouldDirty: true })
    })

    const isValid = await act(async () => {
      return await result.current.trigger()
    })

    // Schema has no max length validation
    expect(isValid).toBe(true)
    expect(result.current.formState.errors).toEqual({})
  })
})

describe('EventForm - Form State', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useForm<EventFormData>({
        defaultValues: getEventFormDefaults(),
      })
    )

    const data = result.current.getValues()
    expect(data.eventName).toBe('')
    expect(data.date).toBe('')
    expect(data.startTime).toBe('')
    expect(data.endTime).toBe('')
    expect(data.venue).toBe('')
    expect(data.attire).toBe('')
    expect(data.description).toBe('')
  })

  it('should reset form to defaults', () => {
    const { result } = renderHook(() => {
      const form = useForm<EventFormData>({
        mode: 'onChange',
        defaultValues: getEventFormDefaults(),
      })
      // Subscribe to formState to enable dirty tracking
      void form.formState.isDirty
      return form
    })

    // Fill in form
    act(() => {
      result.current.setValue('eventName', 'Wedding', { shouldDirty: true })
      result.current.setValue('venue', 'Grand Hall', { shouldDirty: true })
    })

    expect(result.current.formState.isDirty).toBe(true)

    // Reset form
    act(() => {
      result.current.reset(getEventFormDefaults())
    })

    const data = result.current.getValues()
    expect(data.eventName).toBe('')
    expect(data.venue).toBe('')
    expect(result.current.formState.isDirty).toBe(false)
  })

  it('should reset form to event data when editing', () => {
    const eventDateString = mockEvent.date
      ? new Date(mockEvent.date).toISOString().split('T')[0]
      : ''

    const { result } = renderHook(() => {
      const form = useForm<EventFormData>({
        mode: 'onChange',
        defaultValues: {
          eventName: mockEvent.name,
          date: eventDateString,
          startTime: mockEvent.startTime ?? '',
          endTime: mockEvent.endTime ?? '',
          venue: mockEvent.venue ?? '',
          attire: mockEvent.attire ?? '',
          description: mockEvent.description ?? '',
        },
      })
      // Subscribe to formState to enable dirty tracking
      void form.formState.isDirty
      return form
    })

    // Change some fields
    act(() => {
      result.current.setValue('venue', 'Different Venue', { shouldDirty: true })
      result.current.setValue('attire', 'Casual', { shouldDirty: true })
    })

    expect(result.current.formState.isDirty).toBe(true)

    // Reset to original event data
    act(() => {
      result.current.reset({
        eventName: mockEvent.name,
        date: eventDateString,
        startTime: mockEvent.startTime ?? '',
        endTime: mockEvent.endTime ?? '',
        venue: mockEvent.venue ?? '',
        attire: mockEvent.attire ?? '',
        description: mockEvent.description ?? '',
      })
    })

    const data = result.current.getValues()
    expect(data.venue).toBe('Grand Plaza Hotel')
    expect(data.attire).toBe('Black Tie')
    expect(result.current.formState.isDirty).toBe(false)
  })
})
