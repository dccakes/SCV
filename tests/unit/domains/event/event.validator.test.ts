/**
 * Tests for Event Domain Validators
 */

import {
  createEventSchema,
  deleteEventSchema,
  updateCollectRsvpSchema,
  updateEventSchema,
} from '~/server/domains/event/event.validator'

describe('createEventSchema', () => {
  it('should validate a valid event creation input', () => {
    const validInput = {
      eventName: 'Wedding Ceremony',
      date: '2026-06-15',
      startTime: '14:00',
      endTime: '16:00',
      venue: 'Beautiful Garden',
      attire: 'Formal',
      description: 'Our special day!',
    }

    const result = createEventSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      ...validInput,
      collectRsvp: false,
      allowTagAlongs: false,
    })
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

  it('should default allowTagAlongs to false when not provided', () => {
    const input = {
      eventName: 'Reception',
    }

    const result = createEventSchema.safeParse(input)
    expect(result.success).toBe(true)
    expect(result.data?.allowTagAlongs).toBe(false)
  })

  it('should accept allowTagAlongs as true', () => {
    const input = {
      eventName: 'Welcome Party',
      allowTagAlongs: true,
    }

    const result = createEventSchema.safeParse(input)
    expect(result.success).toBe(true)
    expect(result.data?.allowTagAlongs).toBe(true)
  })

  it('should reject non-boolean allowTagAlongs', () => {
    const input = {
      eventName: 'Party',
      allowTagAlongs: 'yes',
    }

    const result = createEventSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('should accept collectRsvp as true', () => {
    const input = {
      eventName: 'Ceremony',
      collectRsvp: true,
    }

    const result = createEventSchema.safeParse(input)
    expect(result.success).toBe(true)
    expect(result.data?.collectRsvp).toBe(true)
  })

  it('should reject non-boolean collectRsvp', () => {
    const input = {
      eventName: 'Ceremony',
      collectRsvp: 'yes',
    }

    const result = createEventSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})

describe('updateEventSchema', () => {
  it('should validate a valid event update input', () => {
    const validInput = {
      eventId: 'event-123',
      eventName: 'Updated Event Name',
      date: '2026-06-16',
      startTime: '15:00',
      endTime: '17:00',
      venue: 'New Venue',
      attire: 'Semi-formal',
      description: 'Updated description',
    }

    const result = updateEventSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      ...validInput,
      collectRsvp: false,
      allowTagAlongs: false,
    })
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

  it('should accept collectRsvp as true in update', () => {
    const input = {
      eventId: 'event-123',
      eventName: 'Event',
      collectRsvp: true,
    }

    const result = updateEventSchema.safeParse(input)
    expect(result.success).toBe(true)
    expect(result.data?.collectRsvp).toBe(true)
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
