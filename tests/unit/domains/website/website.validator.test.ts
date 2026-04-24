/**
 * Tests for Website Domain Validators
 */

import {
  createWebsiteSchema,
  fetchWeddingDataSchema,
  getBySubUrlSchema,
  submitRsvpSchema,
  updateCoverPhotoSchema,
  updateRsvpEnabledSchema,
  updateWebsiteSchema,
} from '~/server/domains/website/website.validator'

describe('createWebsiteSchema', () => {
  it('should validate an empty website creation input', () => {
    const result = createWebsiteSchema.safeParse({})
    expect(result.success).toBe(true)
    expect(result.data).toEqual({})
  })

  it('should strip unknown fields from website creation input', () => {
    const result = createWebsiteSchema.safeParse({
      basePath: 'https://example.com',
      email: 'john@example.com',
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({})
  })
})

describe('updateWebsiteSchema', () => {
  it('should validate valid update input', () => {
    const validInput = {
      isPasswordEnabled: true,
      password: 'secret123',
      subUrl: 'johnandjane',
    }

    const result = updateWebsiteSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should reject subUrl with special characters', () => {
    const invalidInput = {
      subUrl: 'john-and-jane!',
    }

    const result = updateWebsiteSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should reject reserved subUrl values like website', () => {
    const invalidInput = {
      subUrl: 'website',
    }

    const result = updateWebsiteSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should reject reserved subUrl values like w', () => {
    const invalidInput = {
      subUrl: 'w',
    }

    const result = updateWebsiteSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should reject empty update', () => {
    const result = updateWebsiteSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('updateRsvpEnabledSchema', () => {
  it('should validate valid input', () => {
    const validInput = {
      websiteId: 'website-123',
      isRsvpEnabled: true,
    }

    const result = updateRsvpEnabledSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should require websiteId', () => {
    const invalidInput = {
      isRsvpEnabled: true,
    }

    const result = updateRsvpEnabledSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })
})

describe('updateCoverPhotoSchema', () => {
  it('should validate valid input with URL', () => {
    const validInput = {
      coverPhotoUrl: 'https://example.com/photo.jpg',
    }

    const result = updateCoverPhotoSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should allow null coverPhotoUrl', () => {
    const validInput = {
      coverPhotoUrl: null,
    }

    const result = updateCoverPhotoSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })
})

describe('getBySubUrlSchema', () => {
  it('should validate valid subUrl', () => {
    const result = getBySubUrlSchema.safeParse({ subUrl: 'johnandjane' })
    expect(result.success).toBe(true)
  })

  it('should allow null subUrl', () => {
    const result = getBySubUrlSchema.safeParse({ subUrl: null })
    expect(result.success).toBe(true)
  })

  it('should allow undefined subUrl', () => {
    const result = getBySubUrlSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

describe('fetchWeddingDataSchema', () => {
  it('should validate valid subUrl', () => {
    const result = fetchWeddingDataSchema.safeParse({ subUrl: 'johnandjane' })
    expect(result.success).toBe(true)
  })

  it('should require non-empty subUrl', () => {
    const result = fetchWeddingDataSchema.safeParse({ subUrl: '' })
    expect(result.success).toBe(false)
  })
})

describe('submitRsvpSchema', () => {
  it('should validate valid RSVP submission', () => {
    const validInput = {
      rsvpResponses: [
        { eventId: 'event-1', guestId: 1, rsvp: 'Attending' },
        { eventId: 'event-2', guestId: 1, rsvp: 'Declined' },
      ],
      answersToQuestions: [
        {
          questionId: 'q-1',
          questionType: 'Text',
          response: 'Yes, we will bring children',
          guestId: 1,
          householdId: 'hh-1',
          guestFirstName: 'John',
          guestLastName: 'Doe',
        },
      ],
    }

    const result = submitRsvpSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should validate RSVP with Option type answer', () => {
    const validInput = {
      rsvpResponses: [{ eventId: 'event-1', guestId: 1, rsvp: 'Attending' }],
      answersToQuestions: [
        {
          questionId: 'q-1',
          questionType: 'Option',
          response: 'option-id-1',
          guestId: 1,
          householdId: 'hh-1',
          selectedOptionId: 'option-id-1',
        },
      ],
    }

    const result = submitRsvpSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should allow empty arrays', () => {
    const validInput = {
      rsvpResponses: [],
      answersToQuestions: [],
    }

    const result = submitRsvpSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should require rsvpResponses to have required fields', () => {
    const invalidInput = {
      rsvpResponses: [{ eventId: 'event-1' }], // missing guestId and rsvp
      answersToQuestions: [],
    }

    const result = submitRsvpSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })
})
