/**
 * Tests for Self-Fill Domain Validators
 *
 * TDD: These tests define the expected validation behavior.
 * Run first to verify RED state, then implement to GREEN.
 */

import {
  generateTokenSchema,
  getByTokenSchema,
  revokeTokenSchema,
  selfFillGuestSchema,
} from '~/server/domains/self-fill/self-fill.validator'

// ─── getByTokenSchema ─────────────────────────────────────────────────────────

describe('getByTokenSchema', () => {
  it('should accept a valid 32-char hex token', () => {
    const result = getByTokenSchema.safeParse({ token: 'a'.repeat(32) })
    expect(result.success).toBe(true)
  })

  it('should reject an empty token', () => {
    const result = getByTokenSchema.safeParse({ token: '' })
    expect(result.success).toBe(false)
  })

  it('should reject a whitespace-only token', () => {
    const result = getByTokenSchema.safeParse({ token: '   ' })
    expect(result.success).toBe(false)
  })

  it('should trim surrounding whitespace and accept valid token', () => {
    const result = getByTokenSchema.safeParse({ token: `  ${'a'.repeat(32)}  ` })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.token).toBe('a'.repeat(32))
    }
  })

  it('should reject a token shorter than 32 characters', () => {
    const result = getByTokenSchema.safeParse({ token: 'abc123' })
    expect(result.success).toBe(false)
  })

  it('should reject a token longer than 32 characters', () => {
    const result = getByTokenSchema.safeParse({ token: 'a'.repeat(33) })
    expect(result.success).toBe(false)
  })

  it('should reject a token containing non-hex characters', () => {
    const result = getByTokenSchema.safeParse({ token: 'z'.repeat(32) })
    expect(result.success).toBe(false)
  })

  it('should reject a token with uppercase hex characters (tokens are lowercase hex)', () => {
    const result = getByTokenSchema.safeParse({ token: 'A'.repeat(32) })
    expect(result.success).toBe(false)
  })
})

// ─── selfFillGuestSchema ──────────────────────────────────────────────────────

describe('selfFillGuestSchema', () => {
  const validInput = {
    token: 'a'.repeat(32),
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    phone: '+12025550123',
  }

  it('should accept valid guest input', () => {
    const result = selfFillGuestSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  // Token validation (same rules as getByTokenSchema)
  it('should reject missing token', () => {
    const { token: _, ...rest } = validInput
    const result = selfFillGuestSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('should reject non-hex token', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, token: 'z'.repeat(32) })
    expect(result.success).toBe(false)
  })

  // firstName validation
  it('should require firstName', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, firstName: '' })
    expect(result.success).toBe(false)
  })

  it('should trim firstName whitespace', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, firstName: '  Alice  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.firstName).toBe('Alice')
  })

  it('should reject firstName with HTML/script injection characters', () => {
    const result = selfFillGuestSchema.safeParse({
      ...validInput,
      firstName: '<script>alert(1)</script>',
    })
    expect(result.success).toBe(false)
  })

  it('should reject firstName with angle brackets', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, firstName: 'Alice<>' })
    expect(result.success).toBe(false)
  })

  it('should accept firstName with hyphens and apostrophes', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, firstName: "Mary-Jane O'Brien" })
    expect(result.success).toBe(true)
  })

  it('should accept firstName with accented characters', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, firstName: 'Élodie' })
    expect(result.success).toBe(true)
  })

  it('should reject firstName exceeding 100 characters', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, firstName: 'A'.repeat(101) })
    expect(result.success).toBe(false)
  })

  // lastName validation
  it('should require lastName', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, lastName: '' })
    expect(result.success).toBe(false)
  })

  it('should trim lastName whitespace', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, lastName: '  Smith  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.lastName).toBe('Smith')
  })

  it('should reject lastName with HTML injection characters', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, lastName: 'Smith<img src=x>' })
    expect(result.success).toBe(false)
  })

  it('should reject lastName exceeding 100 characters', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, lastName: 'B'.repeat(101) })
    expect(result.success).toBe(false)
  })

  // email validation
  it('should accept null email', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, email: null })
    expect(result.success).toBe(true)
  })

  it('should accept undefined email', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, email: undefined })
    expect(result.success).toBe(true)
  })

  it('should accept empty string email', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, email: '' })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email format', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('should lowercase email on parse', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, email: 'ALICE@EXAMPLE.COM' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe('alice@example.com')
  })

  it('should trim whitespace from email', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, email: '  alice@example.com  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe('alice@example.com')
  })

  it('should convert empty string email to null', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, email: '' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBeNull()
  })

  // phone validation
  it('should accept null phone', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, phone: null })
    expect(result.success).toBe(true)
  })

  it('should accept undefined phone', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, phone: undefined })
    expect(result.success).toBe(true)
  })

  it('should reject phone exceeding 20 characters', () => {
    const result = selfFillGuestSchema.safeParse({ ...validInput, phone: '1'.repeat(21) })
    expect(result.success).toBe(false)
  })
})

// ─── generateTokenSchema ──────────────────────────────────────────────────────

describe('generateTokenSchema', () => {
  it('should accept empty object', () => {
    const result = generateTokenSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

// ─── revokeTokenSchema ────────────────────────────────────────────────────────

describe('revokeTokenSchema', () => {
  it('should accept empty object', () => {
    const result = revokeTokenSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})
