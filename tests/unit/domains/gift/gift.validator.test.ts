/**
 * Tests for Gift Domain Validators
 */

import {
  createGiftSchema,
  giftIdSchema,
  updateGiftSchema,
  upsertGiftSchema,
} from '~/server/domains/gift/gift.validator'

describe('updateGiftSchema', () => {
  it('should validate a valid gift update input', () => {
    const validInput = {
      householdId: 'household-123',
      eventId: 'event-123',
      description: 'Beautiful vase',
      thankyou: true,
    }

    const result = updateGiftSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(validInput)
  })

  it('should require householdId', () => {
    const invalidInput = {
      eventId: 'event-123',
      thankyou: true,
    }

    const result = updateGiftSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require eventId', () => {
    const invalidInput = {
      householdId: 'household-123',
      thankyou: true,
    }

    const result = updateGiftSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require thankyou boolean', () => {
    const invalidInput = {
      householdId: 'household-123',
      eventId: 'event-123',
    }

    const result = updateGiftSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should allow optional description', () => {
    const validInput = {
      householdId: 'household-123',
      eventId: 'event-123',
      thankyou: false,
    }

    const result = updateGiftSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })
})

describe('createGiftSchema', () => {
  it('should validate a valid gift creation input', () => {
    const validInput = {
      householdId: 'household-123',
      eventId: 'event-123',
      description: 'Kitchen set',
      thankyou: false,
    }

    const result = createGiftSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should default thankyou to false', () => {
    const validInput = {
      householdId: 'household-123',
      eventId: 'event-123',
    }

    const result = createGiftSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.thankyou).toBe(false)
    }
  })
})

describe('upsertGiftSchema', () => {
  it('should validate valid upsert input', () => {
    const validInput = {
      householdId: 'household-123',
      eventId: 'event-123',
      description: 'Gift card',
      thankyou: true,
    }

    const result = upsertGiftSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should allow null description', () => {
    const validInput = {
      householdId: 'household-123',
      eventId: 'event-123',
      description: null,
      thankyou: false,
    }

    const result = upsertGiftSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })
})

describe('giftIdSchema', () => {
  it('should validate valid compound ID', () => {
    const validInput = {
      householdId: 'household-123',
      eventId: 'event-123',
    }

    const result = giftIdSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should require non-empty householdId', () => {
    const invalidInput = {
      householdId: '',
      eventId: 'event-123',
    }

    const result = giftIdSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require non-empty eventId', () => {
    const invalidInput = {
      householdId: 'household-123',
      eventId: '',
    }

    const result = giftIdSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })
})
