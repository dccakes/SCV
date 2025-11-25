/**
 * Tests for Question Domain Validators
 */

import {
  deleteQuestionSchema,
  optionInputSchema,
  questionIdSchema,
  upsertQuestionSchema,
} from '~/server/domains/question/question.validator'

describe('optionInputSchema', () => {
  it('should validate a valid option input', () => {
    const validInput = {
      id: 'option-123',
      text: 'Chicken',
      description: 'Grilled chicken with vegetables',
    }

    const result = optionInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should require non-empty text', () => {
    const invalidInput = {
      text: '',
    }

    const result = optionInputSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should allow optional id for new options', () => {
    const validInput = {
      text: 'Vegetarian',
      description: 'Plant-based meal',
    }

    const result = optionInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })
})

describe('upsertQuestionSchema', () => {
  it('should validate a valid event question', () => {
    const validInput = {
      questionId: 'question-123',
      eventId: 'event-123',
      text: 'What is your meal preference?',
      type: 'Option',
      isRequired: true,
      options: [
        { text: 'Chicken', description: 'Grilled' },
        { text: 'Fish', description: 'Pan-seared' },
      ],
    }

    const result = upsertQuestionSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should validate a valid website question', () => {
    const validInput = {
      websiteId: 'website-123',
      text: 'Any dietary restrictions?',
      type: 'Text',
      isRequired: false,
    }

    const result = upsertQuestionSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should require non-empty question text', () => {
    const invalidInput = {
      eventId: 'event-123',
      text: '',
      type: 'Text',
      isRequired: false,
    }

    const result = upsertQuestionSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require at least 2 options for Option type', () => {
    const invalidInput = {
      eventId: 'event-123',
      text: 'Pick one',
      type: 'Option',
      isRequired: true,
      options: [{ text: 'Only one option' }],
    }

    const result = upsertQuestionSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should default isRequired to false', () => {
    const validInput = {
      eventId: 'event-123',
      text: 'Optional question',
      type: 'Text',
    }

    const result = upsertQuestionSchema.safeParse(validInput)
    expect(result).toMatchObject({ success: true, data: { isRequired: false } })
  })

  it('should allow deletedOptions array', () => {
    const validInput = {
      questionId: 'question-123',
      eventId: 'event-123',
      text: 'Updated question',
      type: 'Option',
      isRequired: true,
      options: [
        { text: 'Option A' },
        { text: 'Option B' },
      ],
      deletedOptions: ['option-to-delete-1', 'option-to-delete-2'],
    }

    const result = upsertQuestionSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should allow null for eventId and websiteId', () => {
    const validInput = {
      eventId: null,
      websiteId: 'website-123',
      text: 'Question for website',
      type: 'Text',
      isRequired: false,
    }

    const result = upsertQuestionSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })
})

describe('deleteQuestionSchema', () => {
  it('should validate valid questionId', () => {
    const result = deleteQuestionSchema.safeParse({ questionId: 'question-123' })
    expect(result.success).toBe(true)
  })

  it('should require questionId', () => {
    const result = deleteQuestionSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('should require non-empty questionId', () => {
    const result = deleteQuestionSchema.safeParse({ questionId: '' })
    expect(result.success).toBe(false)
  })
})

describe('questionIdSchema', () => {
  it('should validate valid questionId', () => {
    const result = questionIdSchema.safeParse({ questionId: 'question-123' })
    expect(result.success).toBe(true)
  })

  it('should require non-empty questionId', () => {
    const result = questionIdSchema.safeParse({ questionId: '' })
    expect(result.success).toBe(false)
  })
})
