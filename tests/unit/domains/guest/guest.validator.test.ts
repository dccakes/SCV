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
    expect(result.data).toEqual({
      ...validInput,
      ageGroup: 'ADULT',
      tagIds: [],
      isTagAlong: false,
    })
  })

  it('should validate guest with email and phone', () => {
    const validInput = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+12025550123',
      householdId: 'household-123',
      isPrimaryContact: true,
    }

    const result = createGuestSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      ...validInput,
      ageGroup: 'ADULT',
      tagIds: [],
      isTagAlong: false,
    })
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

  it('should allow optional lastName', () => {
    const validInput = {
      firstName: 'John',
      householdId: 'household-123',
    }

    const result = createGuestSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data?.lastName).toBe('')
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
      phone: '+12025550124',
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
      phone: '+12025550125',
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

describe('phone validation in guest schemas', () => {
  it('accepts valid E.164 phone numbers', () => {
    expect(
      createGuestSchema.safeParse({
        firstName: 'John',
        householdId: 'household-123',
        phone: '+12025550123',
      }).success
    ).toBe(true)

    expect(
      updateGuestSchema.safeParse({
        guestId: 1,
        phone: '+447911123456',
      }).success
    ).toBe(true)

    expect(
      guestPartySchema.safeParse({
        firstName: 'John',
        invites: {},
        phone: '+5511987654321',
      }).success
    ).toBe(true)
  })

  it('rejects invalid phone without country code with a clear message', () => {
    const createResult = createGuestSchema.safeParse({
      firstName: 'John',
      householdId: 'household-123',
      phone: '2025550123',
    })
    expect(createResult.success).toBe(false)
    expect(
      createResult.error?.issues.some(
        (issue) => issue.message === 'Please enter a valid phone number'
      )
    ).toBe(true)
  })

  it('accepts undefined and null', () => {
    expect(
      createGuestSchema.safeParse({
        firstName: 'John',
        householdId: 'household-123',
        phone: undefined,
      }).success
    ).toBe(true)

    expect(
      updateGuestSchema.safeParse({
        guestId: 1,
        phone: null,
      }).success
    ).toBe(true)
  })

  it('transforms empty string to null', () => {
    const result = guestPartySchema.safeParse({
      firstName: 'John',
      invites: {},
      phone: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.phone).toBeNull()
    }
  })
})
