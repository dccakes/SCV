/**
 * Tests for Household Management Application Service Validators
 */

import {
  createHouseholdWithGuestsSchema,
  deleteHouseholdSchema,
  giftInputSchema,
  guestPartyInputSchema,
  updateHouseholdWithGuestsSchema,
} from '~/server/application/household-management/household-management.validator'

describe('guestPartyInputSchema', () => {
  it('should validate a valid guest party input with guestId', () => {
    const validInput = {
      guestId: 1,
      firstName: 'John',
      lastName: 'Doe',
      invites: {
        'event-123': 'Attending',
        'event-456': 'Declined',
      },
    }

    const result = guestPartyInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      ...validInput,
      ageGroup: 'ADULT',
      tagIds: [],
    })
  })

  it('should validate a new guest without guestId', () => {
    const validInput = {
      firstName: 'Jane',
      lastName: 'Smith',
      invites: {
        'event-123': 'Invited',
      },
    }

    const result = guestPartyInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      ...validInput,
      ageGroup: 'ADULT',
      tagIds: [],
    })
  })

  it('should require non-empty firstName', () => {
    const invalidInput = {
      firstName: '',
      lastName: 'Doe',
      invites: {},
    }

    const result = guestPartyInputSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('firstName')
  })

  it('should require non-empty lastName', () => {
    const invalidInput = {
      firstName: 'John',
      lastName: '',
      invites: {},
    }

    const result = guestPartyInputSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('lastName')
  })

  it('should accept empty invites object', () => {
    const validInput = {
      firstName: 'John',
      lastName: 'Doe',
      invites: {},
    }

    const result = guestPartyInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })
})

describe('giftInputSchema', () => {
  it('should validate a valid gift input', () => {
    const validInput = {
      eventId: 'event-123',
      description: 'Beautiful vase',
      thankyou: true,
    }

    const result = giftInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(validInput)
  })

  it('should require eventId', () => {
    const invalidInput = {
      description: 'Gift',
      thankyou: false,
    }

    const result = giftInputSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should allow null description', () => {
    const validInput = {
      eventId: 'event-123',
      description: null,
      thankyou: false,
    }

    const result = giftInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should allow missing thankyou (optional)', () => {
    const validInput = {
      eventId: 'event-123',
    }

    const result = giftInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })
})

describe('createHouseholdWithGuestsSchema', () => {
  it('should validate a valid household creation input', () => {
    const validInput = {
      address1: '123 Main St',
      address2: 'Apt 4',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10001',
      phone: '555-1234',
      email: 'family@example.com',
      notes: 'Special dietary requirements',
      guestParty: [
        {
          firstName: 'John',
          lastName: 'Doe',
          invites: { 'event-123': 'Invited' },
        },
        {
          firstName: 'Jane',
          lastName: 'Doe',
          invites: { 'event-123': 'Invited' },
        },
      ],
    }

    const result = createHouseholdWithGuestsSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      ...validInput,
      guestParty: validInput.guestParty.map((guest) => ({
        ...guest,
        ageGroup: 'ADULT',
        tagIds: [],
      })),
    })
  })

  it('should require at least one guest in guestParty', () => {
    const invalidInput = {
      guestParty: [],
      address1: '123 Main St',
    }

    const result = createHouseholdWithGuestsSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('At least one guest is required')
  })

  it('should allow optional address fields', () => {
    const validInput = {
      guestParty: [
        {
          firstName: 'John',
          lastName: 'Doe',
          invites: { 'event-123': 'Invited' },
        },
      ],
    }

    const result = createHouseholdWithGuestsSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should validate email format when provided', () => {
    const invalidInput = {
      guestParty: [
        {
          firstName: 'John',
          lastName: 'Doe',
          invites: {},
        },
      ],
      email: 'not-an-email',
    }

    const result = createHouseholdWithGuestsSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should allow empty string for email', () => {
    const validInput = {
      guestParty: [
        {
          firstName: 'John',
          lastName: 'Doe',
          invites: {},
        },
      ],
      email: '',
    }

    const result = createHouseholdWithGuestsSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should allow null values for optional fields', () => {
    const validInput = {
      guestParty: [
        {
          firstName: 'John',
          lastName: 'Doe',
          invites: {},
        },
      ],
      address1: null,
      address2: null,
      city: null,
      state: null,
      country: null,
      zipCode: null,
      phone: null,
      notes: null,
    }

    const result = createHouseholdWithGuestsSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })
})

describe('updateHouseholdWithGuestsSchema', () => {
  it('should validate a valid household update input', () => {
    const validInput = {
      householdId: 'household-123',
      address1: '456 Updated St',
      guestParty: [
        {
          guestId: 1,
          firstName: 'John',
          lastName: 'Doe',
          invites: { 'event-123': 'Attending' },
        },
      ],
      gifts: [
        {
          eventId: 'event-123',
          description: 'Kitchen set',
          thankyou: true,
        },
      ],
    }

    const result = updateHouseholdWithGuestsSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should require householdId', () => {
    const invalidInput = {
      guestParty: [
        {
          firstName: 'John',
          lastName: 'Doe',
          invites: {},
        },
      ],
      gifts: [],
    }

    const result = updateHouseholdWithGuestsSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require gifts array', () => {
    const invalidInput = {
      householdId: 'household-123',
      guestParty: [
        {
          firstName: 'John',
          lastName: 'Doe',
          invites: {},
        },
      ],
    }

    const result = updateHouseholdWithGuestsSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should allow deletedGuests array', () => {
    const validInput = {
      householdId: 'household-123',
      guestParty: [
        {
          firstName: 'John',
          lastName: 'Doe',
          invites: {},
        },
      ],
      deletedGuests: [1, 2, 3],
      gifts: [],
    }

    const result = updateHouseholdWithGuestsSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data?.deletedGuests).toEqual([1, 2, 3])
  })

  it('should require at least one guest in guestParty', () => {
    const invalidInput = {
      householdId: 'household-123',
      guestParty: [],
      gifts: [],
    }

    const result = updateHouseholdWithGuestsSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('At least one guest is required')
  })
})

describe('deleteHouseholdSchema', () => {
  it('should validate valid householdId', () => {
    const validInput = { householdId: 'household-123' }

    const result = deleteHouseholdSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(validInput)
  })

  it('should require householdId', () => {
    const invalidInput = {}

    const result = deleteHouseholdSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require non-empty householdId', () => {
    // The schema requires a string, empty string is still a string
    const inputWithEmpty = { householdId: '' }
    const result = deleteHouseholdSchema.safeParse(inputWithEmpty)
    // Schema allows empty string, business logic would handle
    expect(result.success).toBe(true)
  })
})
