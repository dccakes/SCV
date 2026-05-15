import {
  isValidE164Phone,
  normalizePhoneToE164,
  optionalPhoneSchema,
  optionalPhoneSchemaNotNull,
} from '~/lib/phone/phone-validator'

describe('isValidE164Phone', () => {
  it('returns true for nullish and empty values', () => {
    expect(isValidE164Phone(undefined)).toBe(true)
    expect(isValidE164Phone(null)).toBe(true)
    expect(isValidE164Phone('')).toBe(true)
  })

  it('returns true for valid E.164 numbers across countries', () => {
    expect(isValidE164Phone('+12025550123')).toBe(true) // US
    expect(isValidE164Phone('+447911123456')).toBe(true) // UK
    expect(isValidE164Phone('+5511987654321')).toBe(true) // Brazil
  })

  it('returns false for invalid or non-E.164 values', () => {
    expect(isValidE164Phone('2025550123')).toBe(false) // no country code
    expect(isValidE164Phone('+12')).toBe(false) // too short
    expect(isValidE164Phone('abc123')).toBe(false)
    expect(isValidE164Phone('+1 (202) 555-0123')).toBe(false) // formatted, not strict E.164
  })
})

describe('optionalPhoneSchema', () => {
  it('accepts undefined, null, and valid E.164', () => {
    expect(optionalPhoneSchema.safeParse(undefined).success).toBe(true)
    expect(optionalPhoneSchema.safeParse(null).success).toBe(true)
    expect(optionalPhoneSchema.safeParse('+12025550123').success).toBe(true)
  })

  it('transforms empty string to null', () => {
    const result = optionalPhoneSchema.parse('')
    expect(result).toBeNull()
  })

  it('rejects non-empty invalid strings', () => {
    const result = optionalPhoneSchema.safeParse('2025550123')
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('Please enter a valid phone number')
  })
})

describe('optionalPhoneSchemaNotNull', () => {
  it('accepts undefined and valid E.164', () => {
    expect(optionalPhoneSchemaNotNull.safeParse(undefined).success).toBe(true)
    expect(optionalPhoneSchemaNotNull.safeParse('+12025550123').success).toBe(true)
  })

  it('transforms empty string to undefined', () => {
    const result = optionalPhoneSchemaNotNull.parse('')
    expect(result).toBeUndefined()
  })

  it('rejects null and invalid strings', () => {
    const nullResult = optionalPhoneSchemaNotNull.safeParse(null)
    expect(nullResult.success).toBe(false)

    const invalidResult = optionalPhoneSchemaNotNull.safeParse('2025550123')
    expect(invalidResult.success).toBe(false)
    expect(invalidResult.error?.issues[0]?.message).toBe('Please enter a valid phone number')
  })
})

describe('normalizePhoneToE164', () => {
  it('returns valid E.164 values unchanged', () => {
    expect(normalizePhoneToE164('+12025550123')).toBe('+12025550123')
  })

  it('normalizes formatted valid numbers to strict E.164', () => {
    expect(normalizePhoneToE164('+1 (202) 555-0123')).toBe('+12025550123')
  })

  it('returns undefined for legacy invalid numbers that cannot be normalized', () => {
    expect(normalizePhoneToE164('+1-555-0101')).toBeUndefined()
  })
})
