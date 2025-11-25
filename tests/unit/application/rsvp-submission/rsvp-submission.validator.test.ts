/**
 * Tests for RSVP Submission Application Service Validators
 */

import {
  answerToQuestionSchema,
  rsvpResponseSchema,
  submitRsvpSchema,
} from '~/server/application/rsvp-submission/rsvp-submission.validator'

describe('rsvpResponseSchema', () => {
  it('should validate a valid RSVP response', () => {
    const validInput = {
      eventId: 'event-123',
      guestId: 1,
      rsvp: 'Attending',
    }

    const result = rsvpResponseSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(validInput)
  })

  it('should require eventId', () => {
    const invalidInput = {
      guestId: 1,
      rsvp: 'Attending',
    }

    const result = rsvpResponseSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require guestId', () => {
    const invalidInput = {
      eventId: 'event-123',
      rsvp: 'Attending',
    }

    const result = rsvpResponseSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require rsvp', () => {
    const invalidInput = {
      eventId: 'event-123',
      guestId: 1,
    }

    const result = rsvpResponseSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should accept various RSVP statuses', () => {
    const statuses = ['Invited', 'Attending', 'Declined', 'Not Invited']

    statuses.forEach((rsvp) => {
      const result = rsvpResponseSchema.safeParse({
        eventId: 'event-123',
        guestId: 1,
        rsvp,
      })
      expect(result.success).toBe(true)
    })
  })
})

describe('answerToQuestionSchema', () => {
  it('should validate a valid text question answer', () => {
    const validInput = {
      questionId: 'question-123',
      questionType: 'Text',
      response: 'This is my answer',
      guestId: 1,
      householdId: 'household-123',
    }

    const result = answerToQuestionSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(validInput)
  })

  it('should validate a valid option question answer', () => {
    const validInput = {
      questionId: 'question-123',
      questionType: 'Option',
      response: 'option-456',
      guestId: 1,
      householdId: 'household-123',
      selectedOptionId: 'option-456',
    }

    const result = answerToQuestionSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should require questionId', () => {
    const invalidInput = {
      questionType: 'Text',
      response: 'Answer',
    }

    const result = answerToQuestionSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require questionType', () => {
    const invalidInput = {
      questionId: 'question-123',
      response: 'Answer',
    }

    const result = answerToQuestionSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require response', () => {
    const invalidInput = {
      questionId: 'question-123',
      questionType: 'Text',
    }

    const result = answerToQuestionSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should allow null guestId', () => {
    const validInput = {
      questionId: 'question-123',
      questionType: 'Text',
      response: 'Answer',
      guestId: null,
      householdId: 'household-123',
    }

    const result = answerToQuestionSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should allow null householdId', () => {
    const validInput = {
      questionId: 'question-123',
      questionType: 'Text',
      response: 'Answer',
      guestId: 1,
      householdId: null,
    }

    const result = answerToQuestionSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should allow optional guest name fields', () => {
    const validInput = {
      questionId: 'question-123',
      questionType: 'Text',
      response: 'Answer',
      guestFirstName: 'John',
      guestLastName: 'Doe',
    }

    const result = answerToQuestionSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data?.guestFirstName).toBe('John')
    expect(result.data?.guestLastName).toBe('Doe')
  })
})

describe('submitRsvpSchema', () => {
  it('should validate a complete RSVP submission', () => {
    const validInput = {
      rsvpResponses: [
        { eventId: 'event-123', guestId: 1, rsvp: 'Attending' },
        { eventId: 'event-456', guestId: 1, rsvp: 'Declined' },
      ],
      answersToQuestions: [
        {
          questionId: 'question-123',
          questionType: 'Text',
          response: 'Vegetarian',
          guestId: 1,
        },
        {
          questionId: 'question-456',
          questionType: 'Option',
          response: 'option-789',
          householdId: 'household-123',
        },
      ],
    }

    const result = submitRsvpSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data?.rsvpResponses).toHaveLength(2)
    expect(result.data?.answersToQuestions).toHaveLength(2)
  })

  it('should allow empty rsvpResponses array', () => {
    const validInput = {
      rsvpResponses: [],
      answersToQuestions: [],
    }

    const result = submitRsvpSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should require rsvpResponses array', () => {
    const invalidInput = {
      answersToQuestions: [],
    }

    const result = submitRsvpSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require answersToQuestions array', () => {
    const invalidInput = {
      rsvpResponses: [],
    }

    const result = submitRsvpSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should validate nested rsvpResponse items', () => {
    const invalidInput = {
      rsvpResponses: [
        { eventId: 'event-123', guestId: 'not-a-number', rsvp: 'Attending' }, // guestId should be number
      ],
      answersToQuestions: [],
    }

    const result = submitRsvpSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should validate nested answerToQuestion items', () => {
    const invalidInput = {
      rsvpResponses: [],
      answersToQuestions: [
        { questionId: 'q-123' }, // missing required fields
      ],
    }

    const result = submitRsvpSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })
})
