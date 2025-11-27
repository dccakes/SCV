/**
 * Tests for Guest Domain Validators
 */

import {
  createGuestSchema,
  getByHouseholdSchema,
  guestIdSchema,
  guestPartySchema,
  updateGuestSchema,
} from '~/server/domains/guest/guest.validator'

describe('createGuestSchema', () => {
  it('should validate a valid guest creation input', () => {
    const validInput = {
      firstName: 'John',
      lastName: 'Doe',
      householdId: 'household-123',
      isPrimaryContact: true,
    }

    const result = createGuestSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(validInput)
  })

  it('should validate guest with email and phone', () => {
    const validInput = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      householdId: 'household-123',
      isPrimaryContact: true,
    }

    const result = createGuestSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(validInput)
  })

  it('should reject invalid email format', () => {
    const invalidInput = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'invalid-email',
      householdId: 'household-123',
    }

    const result = createGuestSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should allow null email', () => {
    const validInput = {
      firstName: 'John',
      lastName: 'Doe',
      email: null,
      householdId: 'household-123',
    }

    const result = createGuestSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should allow optional email', () => {
    const validInput = {
      firstName: 'John',
      lastName: 'Doe',
      householdId: 'household-123',
    }

    const result = createGuestSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should require firstName', () => {
    const invalidInput = {
      lastName: 'Doe',
      householdId: 'household-123',
    }

    const result = createGuestSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require lastName', () => {
    const invalidInput = {
      firstName: 'John',
      householdId: 'household-123',
    }

    const result = createGuestSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require non-empty firstName', () => {
    const invalidInput = {
      firstName: '',
      lastName: 'Doe',
      householdId: 'household-123',
    }

    const result = createGuestSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should default isPrimaryContact to false', () => {
    const validInput = {
      firstName: 'John',
      lastName: 'Doe',
      householdId: 'household-123',
    }

    const result = createGuestSchema.safeParse(validInput)
    expect(result).toMatchObject({ success: true, data: { isPrimaryContact: false } })
  })
})

describe('updateGuestSchema', () => {
  it('should validate a valid guest update input', () => {
    const validInput = {
      guestId: 1,
      firstName: 'Jane',
      lastName: 'Smith',
    }

    const result = updateGuestSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should validate update with email and phone', () => {
    const validInput = {
      guestId: 1,
      firstName: 'Jane',
      email: 'jane@example.com',
      phone: '+9876543210',
    }

    const result = updateGuestSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should reject invalid email in update', () => {
    const invalidInput = {
      guestId: 1,
      email: 'not-an-email',
    }

    const result = updateGuestSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require guestId', () => {
    const invalidInput = {
      firstName: 'Jane',
    }

    const result = updateGuestSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should allow partial updates', () => {
    const validInput = {
      guestId: 1,
      firstName: 'Jane',
    }

    const result = updateGuestSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })
})

describe('guestIdSchema', () => {
  it('should validate valid guestId', () => {
    const result = guestIdSchema.safeParse({ guestId: 123 })
    expect(result.success).toBe(true)
  })

  it('should require guestId to be a number', () => {
    const result = guestIdSchema.safeParse({ guestId: 'not-a-number' })
    expect(result.success).toBe(false)
  })
})

describe('getByHouseholdSchema', () => {
  it('should validate valid householdId', () => {
    const result = getByHouseholdSchema.safeParse({ householdId: 'household-123' })
    expect(result.success).toBe(true)
  })

  it('should require non-empty householdId', () => {
    const result = getByHouseholdSchema.safeParse({ householdId: '' })
    expect(result.success).toBe(false)
  })
})

describe('guestPartySchema', () => {
  it('should validate a valid guest party input', () => {
    const validInput = {
      guestId: 1,
      firstName: 'John',
      lastName: 'Doe',
      invites: {
        'event-123': 'Attending',
        'event-456': 'Declined',
      },
    }

    const result = guestPartySchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should validate guest party with email and phone', () => {
    const validInput = {
      guestId: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      invites: {
        'event-123': 'Attending',
      },
    }

    const result = guestPartySchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should reject invalid email in guest party', () => {
    const invalidInput = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'bad-email',
      invites: {
        'event-123': 'Invited',
      },
    }

    const result = guestPartySchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should allow guestId to be optional (for new guests)', () => {
    const validInput = {
      firstName: 'New',
      lastName: 'Guest',
      invites: {
        'event-123': 'Invited',
      },
    }

    const result = guestPartySchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should require invites record', () => {
    const invalidInput = {
      firstName: 'John',
      lastName: 'Doe',
    }

    const result = guestPartySchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })
})
