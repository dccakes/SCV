/**
 * Tests for Household Domain Validators
 */

import {
  createHouseholdSchema,
  deleteHouseholdSchema,
  guestPartyInputSchema,
  householdIdSchema,
  searchHouseholdSchema,
  updateHouseholdSchema,
} from '~/server/domains/household/household.validator'

describe('guestPartyInputSchema', () => {
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

    const result = guestPartyInputSchema.safeParse(validInput)
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

    const result = guestPartyInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should reject invalid email format in guest party', () => {
    const invalidInput = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'not-valid-email',
      invites: {
        'event-123': 'Invited',
      },
    }

    const result = guestPartyInputSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should allow null email and phone', () => {
    const validInput = {
      firstName: 'John',
      lastName: 'Doe',
      email: null,
      phone: null,
      invites: {
        'event-123': 'Invited',
      },
    }

    const result = guestPartyInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should allow guestId to be optional (for new guests)', () => {
    const validInput = {
      firstName: 'New',
      lastName: 'Guest',
      invites: {
        'event-123': 'Invited',
      },
    }

    const result = guestPartyInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should require non-empty firstName', () => {
    const invalidInput = {
      firstName: '',
      lastName: 'Doe',
      invites: {},
    }

    const result = guestPartyInputSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require non-empty lastName', () => {
    const invalidInput = {
      firstName: 'John',
      lastName: '',
      invites: {},
    }

    const result = guestPartyInputSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })
})

describe('createHouseholdSchema', () => {
  it('should validate a valid household creation input', () => {
    const validInput = {
      guestParty: [
        {
          firstName: 'John',
          lastName: 'Doe',
          isPrimaryContact: true,
          invites: { 'event-123': 'Invited' },
        },
      ],
      address1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      email: 'doe@example.com',
    }

    const result = createHouseholdSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should require at least one guest in guestParty', () => {
    const validInput = {
      guestParty: [],
      address1: '123 Main St',
    }

    const result = createHouseholdSchema.safeParse(validInput)
    // Empty array should fail - need at least one guest with primary contact
    expect(result.success).toBe(false)
  })

  it('should allow optional address fields', () => {
    const validInput = {
      guestParty: [
        {
          firstName: 'John',
          lastName: 'Doe',
          isPrimaryContact: true,
          invites: { 'event-123': 'Invited' },
        },
      ],
    }

    const result = createHouseholdSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should validate email format when provided', () => {
    const invalidInput = {
      guestParty: [
        {
          firstName: 'John',
          lastName: 'Doe',
          isPrimaryContact: true,
          invites: {},
        },
      ],
      email: 'not-an-email',
    }

    const result = createHouseholdSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should allow null for optional fields', () => {
    const validInput = {
      guestParty: [
        {
          firstName: 'John',
          lastName: 'Doe',
          isPrimaryContact: true,
          invites: {},
        },
      ],
      address1: null,
      address2: null,
      city: null,
    }

    const result = createHouseholdSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })
})

describe('updateHouseholdSchema', () => {
  it('should validate a valid household update input', () => {
    const validInput = {
      householdId: 'household-123',
      guestParty: [
        {
          guestId: 1,
          firstName: 'John',
          lastName: 'Doe',
          isPrimaryContact: true,
          invites: { 'event-123': 'Attending' },
        },
      ],
      address1: '456 New St',
      gifts: [
        {
          eventId: 'event-123',
          thankyou: true,
          description: 'Beautiful vase',
        },
      ],
    }

    const result = updateHouseholdSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should require householdId', () => {
    const invalidInput = {
      guestParty: [
        {
          firstName: 'John',
          lastName: 'Doe',
          isPrimaryContact: true,
          invites: {},
        },
      ],
      gifts: [],
    }

    const result = updateHouseholdSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require gifts array', () => {
    const invalidInput = {
      householdId: 'household-123',
      guestParty: [
        {
          firstName: 'John',
          lastName: 'Doe',
          isPrimaryContact: true,
          invites: {},
        },
      ],
    }

    const result = updateHouseholdSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should allow deletedGuests array', () => {
    const validInput = {
      householdId: 'household-123',
      guestParty: [
        {
          firstName: 'John',
          lastName: 'Doe',
          isPrimaryContact: true,
          invites: {},
        },
      ],
      deletedGuests: [1, 2, 3],
      gifts: [],
    }

    const result = updateHouseholdSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })
})

describe('deleteHouseholdSchema', () => {
  it('should validate valid householdId', () => {
    const result = deleteHouseholdSchema.safeParse({ householdId: 'household-123' })
    expect(result.success).toBe(true)
  })

  it('should require non-empty householdId', () => {
    const result = deleteHouseholdSchema.safeParse({ householdId: '' })
    expect(result.success).toBe(false)
  })
})

describe('searchHouseholdSchema', () => {
  it('should validate valid search text', () => {
    const result = searchHouseholdSchema.safeParse({ searchText: 'John' })
    expect(result.success).toBe(true)
  })

  it('should require minimum 2 characters', () => {
    const result = searchHouseholdSchema.safeParse({ searchText: 'J' })
    expect(result.success).toBe(false)
  })
})

describe('householdIdSchema', () => {
  it('should validate valid householdId', () => {
    const result = householdIdSchema.safeParse({ householdId: 'household-123' })
    expect(result.success).toBe(true)
  })

  it('should require non-empty householdId', () => {
    const result = householdIdSchema.safeParse({ householdId: '' })
    expect(result.success).toBe(false)
  })
})
