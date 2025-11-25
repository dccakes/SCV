/**
 * Tests for User Domain Validators
 */

import { createUserSchema, updateUserSchema } from '~/server/domains/user/user.validator'

describe('createUserSchema', () => {
  it('should validate a valid user creation input', () => {
    const validInput = {
      id: 'user-123',
      email: 'test@example.com',
      websiteUrl: 'https://example.com/wedding',
      groomFirstName: 'John',
      groomLastName: 'Doe',
      brideFirstName: 'Jane',
      brideLastName: 'Doe',
    }

    const result = createUserSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(validInput)
  })

  it('should require id field', () => {
    const invalidInput = {
      email: 'test@example.com',
    }

    const result = createUserSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should require valid email', () => {
    const invalidInput = {
      id: 'user-123',
      email: 'invalid-email',
    }

    const result = createUserSchema.safeParse(invalidInput)
    expect(result.success).toBe(false)
  })

  it('should allow optional fields', () => {
    const minimalInput = {
      id: 'user-123',
      email: 'test@example.com',
    }

    const result = createUserSchema.safeParse(minimalInput)
    expect(result.success).toBe(true)
  })
})

describe('updateUserSchema', () => {
  it('should validate a valid update input', () => {
    const validInput = {
      name: 'John Doe',
      groomFirstName: 'John',
      groomLastName: 'Doe',
    }

    const result = updateUserSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(validInput)
  })

  it('should allow empty update', () => {
    const emptyInput = {}

    const result = updateUserSchema.safeParse(emptyInput)
    expect(result.success).toBe(true)
  })

  it('should allow partial updates', () => {
    const partialInput = {
      groomFirstName: 'Updated Name',
    }

    const result = updateUserSchema.safeParse(partialInput)
    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty('groomFirstName', 'Updated Name')
  })
})
