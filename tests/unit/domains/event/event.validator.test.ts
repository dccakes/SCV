/**
 * Tests for Event Domain Validators
 */

import {
  createEventSchema,
  updateEventSchema,
  updateCollectRsvpSchema,
  deleteEventSchema,
} from '~/server/domains/event/event.validator'

describe('createEventSchema', () => {
  it('should validate a valid event creation input', () => {
    const validInput = {
      eventName: 'Wedding Ceremony',
      date: '2024-06-15',
      startTime: '14:00',
      endTime: '16:00',
      venue: 'Beautiful Garden',
      attire: 'Formal',
      description: 'Our special day!',
    }

    const result = createEventSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validInput)
    }
  })

  it('should require eventName', () => {
    const invalidInput = {
      date: '2024-06-15',
    }

    const result = createEventSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require non-empty eventName', () => {
    const invalidInput = {
      eventName: '',
    }

    const result = createEventSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should allow only eventName', () => {
    const minimalInput = {
      eventName: 'Reception',
    }

    const result = createEventSchema.safeParse(minimalInput)
    expect(result.success).toBe(true)
  })

  it('should allow optional fields to be undefined', () => {
    const input = {
      eventName: 'Rehearsal Dinner',
      venue: 'Restaurant',
      // other fields omitted
    }

    const result = createEventSchema.safeParse(input)
    expect(result.success).toBe(true)
  })
})

describe('updateEventSchema', () => {
  it('should validate a valid event update input', () => {
    const validInput = {
      eventId: 'event-123',
      eventName: 'Updated Event Name',
      date: '2024-06-16',
      startTime: '15:00',
      endTime: '17:00',
      venue: 'New Venue',
      attire: 'Semi-formal',
      description: 'Updated description',
    }

    const result = updateEventSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validInput)
    }
  })

  it('should require eventId', () => {
    const invalidInput = {
      eventName: 'Updated Event',
    }

    const result = updateEventSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require eventName', () => {
    const invalidInput = {
      eventId: 'event-123',
    }

    const result = updateEventSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require non-empty eventId', () => {
    const invalidInput = {
      eventId: '',
      eventName: 'Event',
    }

    const result = updateEventSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })
})

describe('updateCollectRsvpSchema', () => {
  it('should validate valid input', () => {
    const validInput = {
      eventId: 'event-123',
      collectRsvp: true,
    }

    const result = updateCollectRsvpSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should require eventId', () => {
    const invalidInput = {
      collectRsvp: true,
    }

    const result = updateCollectRsvpSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require collectRsvp boolean', () => {
    const invalidInput = {
      eventId: 'event-123',
    }

    const result = updateCollectRsvpSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should accept false for collectRsvp', () => {
    const validInput = {
      eventId: 'event-123',
      collectRsvp: false,
    }

    const result = updateCollectRsvpSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })
})

describe('deleteEventSchema', () => {
  it('should validate valid eventId', () => {
    const result = deleteEventSchema.safeParse({ eventId: 'event-123' })
    expect(result.success).toBe(true)
  })

  it('should require eventId', () => {
    const result = deleteEventSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('should require non-empty eventId', () => {
    const result = deleteEventSchema.safeParse({ eventId: '' })
    expect(result.success).toBe(false)
  })
})
