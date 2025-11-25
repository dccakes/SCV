/**
 * Tests for Website Domain Validators
 */

import {
  createWebsiteSchema,
  updateWebsiteSchema,
  updateRsvpEnabledSchema,
  updateCoverPhotoSchema,
  getBySubUrlSchema,
  fetchWeddingDataSchema,
  submitRsvpSchema,
} from '~/server/domains/website/website.validator'

describe('createWebsiteSchema', () => {
  it('should validate a valid website creation input', () => {
    const validInput = {
      firstName: 'John',
      lastName: 'Doe',
      partnerFirstName: 'Jane',
      partnerLastName: 'Smith',
      basePath: 'https://example.com',
      email: 'john@example.com',
    }

    const result = createWebsiteSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validInput)
    }
  })

  it('should require all fields', () => {
    const invalidInput = {
      firstName: 'John',
    }

    const result = createWebsiteSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require valid email', () => {
    const invalidInput = {
      firstName: 'John',
      lastName: 'Doe',
      partnerFirstName: 'Jane',
      partnerLastName: 'Smith',
      basePath: 'https://example.com',
      email: 'invalid-email',
    }

    const result = createWebsiteSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
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

  it('should allow empty update', () => {
    const result = updateWebsiteSchema.safeParse({})
    expect(result.success).toBe(true)
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
      userId: 'user-123',
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
