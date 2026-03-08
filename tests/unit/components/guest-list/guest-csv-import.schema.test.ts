/**
 * Tests for Guest CSV Import Schema & Parsing
 *
 * Covers: guestCsvRowSchema validation, empty-string normalization,
 * ageGroup coercion, and parseCsvFile() row mapping.
 */

import {
  guestCsvRowSchema,
  parseCsvFile,
} from '~/components/guest-list/guest-csv-import.schema'

// ---------------------------------------------------------------------------
// guestCsvRowSchema
// ---------------------------------------------------------------------------

describe('guestCsvRowSchema', () => {
  describe('valid rows', () => {
    it('should accept a fully populated row', () => {
      const input = {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        phone: '555-1234',
        ageGroup: 'ADULT',
        address1: '123 Main St',
        address2: 'Apt 2',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        notes: 'Dietary: vegetarian',
      }

      const result = guestCsvRowSchema.safeParse(input)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        phone: '555-1234',
        ageGroup: 'ADULT',
        address1: '123 Main St',
        address2: 'Apt 2',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        notes: 'Dietary: vegetarian',
      })
    })

    it('should accept a minimal row with only firstName and lastName', () => {
      const input = { firstName: 'Jane', lastName: 'Doe' }

      const result = guestCsvRowSchema.safeParse(input)

      expect(result.success).toBe(true)
      expect(result.data?.firstName).toBe('Jane')
      expect(result.data?.lastName).toBe('Doe')
      // ageGroup should default to ADULT when omitted
      expect(result.data?.ageGroup).toBe('ADULT')
    })

    it('should accept all valid ageGroup values', () => {
      const validAgeGroups = ['ADULT', 'CHILD', 'TEEN', 'INFANT'] as const

      for (const ageGroup of validAgeGroups) {
        const result = guestCsvRowSchema.safeParse({
          firstName: 'Test',
          lastName: 'User',
          ageGroup,
        })

        expect(result.success).toBe(true)
        expect(result.data?.ageGroup).toBe(ageGroup)
      }
    })

    it('should coerce ageGroup to uppercase when provided in lowercase', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: 'Jane',
        lastName: 'Doe',
        ageGroup: 'child',
      })

      expect(result.success).toBe(true)
      expect(result.data?.ageGroup).toBe('CHILD')
    })

    it('should coerce ageGroup to uppercase when provided in mixed case', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: 'Jane',
        lastName: 'Doe',
        ageGroup: 'Teen',
      })

      expect(result.success).toBe(true)
      expect(result.data?.ageGroup).toBe('TEEN')
    })
  })

  describe('ageGroup coercion and fallback', () => {
    it('should default to ADULT when ageGroup is omitted', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
      })

      expect(result.success).toBe(true)
      expect(result.data?.ageGroup).toBe('ADULT')
    })

    it('should default to ADULT when ageGroup is an unknown value', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        ageGroup: 'SENIOR',
      })

      // The schema maps unknown values to 'ADULT' before piping to z.enum,
      // so this should still succeed
      expect(result.success).toBe(true)
      expect(result.data?.ageGroup).toBe('ADULT')
    })

    it('should default to ADULT when ageGroup is an empty string', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        ageGroup: '',
      })

      expect(result.success).toBe(true)
      expect(result.data?.ageGroup).toBe('ADULT')
    })
  })

  describe('invalid rows — missing required fields', () => {
    it('should reject a row missing firstName', () => {
      const result = guestCsvRowSchema.safeParse({
        lastName: 'Doe',
      })

      expect(result.success).toBe(false)
      const paths = result.error?.issues.flatMap((i) => i.path)
      expect(paths).toContain('firstName')
    })

    it('should reject a row where firstName is an empty string', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: '',
        lastName: 'Doe',
      })

      expect(result.success).toBe(false)
      const paths = result.error?.issues.flatMap((i) => i.path)
      expect(paths).toContain('firstName')
    })

    it('should reject a row missing lastName', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: 'John',
      })

      expect(result.success).toBe(false)
      const paths = result.error?.issues.flatMap((i) => i.path)
      expect(paths).toContain('lastName')
    })

    it('should reject a row where lastName is an empty string', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: 'John',
        lastName: '',
      })

      expect(result.success).toBe(false)
      const paths = result.error?.issues.flatMap((i) => i.path)
      expect(paths).toContain('lastName')
    })
  })

  describe('invalid rows — bad email', () => {
    it('should reject a row with an invalid email format', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'not-an-email',
      })

      expect(result.success).toBe(false)
      const paths = result.error?.issues.flatMap((i) => i.path)
      expect(paths).toContain('email')
    })

    it('should reject an email missing the domain', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@',
      })

      expect(result.success).toBe(false)
    })

    it('should accept a valid email', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe+tag@example.co.uk',
      })

      expect(result.success).toBe(true)
      expect(result.data?.email).toBe('john.doe+tag@example.co.uk')
    })
  })

  describe('empty string normalization for optional fields', () => {
    it('should normalize empty string email to undefined', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: '',
      })

      // An empty string passes through optionalString (which maps '' → undefined)
      // and then the optional email pipe accepts undefined
      expect(result.success).toBe(true)
      expect(result.data?.email).toBeUndefined()
    })

    it('should normalize empty string phone to undefined', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        phone: '',
      })

      expect(result.success).toBe(true)
      expect(result.data?.phone).toBeUndefined()
    })

    it('should normalize empty string address1 to undefined', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        address1: '',
      })

      expect(result.success).toBe(true)
      expect(result.data?.address1).toBeUndefined()
    })

    it('should normalize empty string city to undefined', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        city: '',
      })

      expect(result.success).toBe(true)
      expect(result.data?.city).toBeUndefined()
    })

    it('should normalize empty string notes to undefined', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        notes: '',
      })

      expect(result.success).toBe(true)
      expect(result.data?.notes).toBeUndefined()
    })

    it('should preserve non-empty optional string values', () => {
      const result = guestCsvRowSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        phone: '555-9876',
        city: 'Boston',
        notes: 'VIP',
      })

      expect(result.success).toBe(true)
      expect(result.data?.phone).toBe('555-9876')
      expect(result.data?.city).toBe('Boston')
      expect(result.data?.notes).toBe('VIP')
    })
  })
})

// ---------------------------------------------------------------------------
// parseCsvFile()
// ---------------------------------------------------------------------------

describe('parseCsvFile', () => {
  /**
   * Helper to build a File from a CSV string so we can pass it to parseCsvFile.
   */
  function makeCsvFile(content: string): File {
    const blob = new Blob([content], { type: 'text/csv' })
    return new File([blob], 'test.csv', { type: 'text/csv' })
  }

  const HEADERS =
    'firstName,lastName,email,phone,ageGroup,address1,address2,city,state,zipCode,country,notes'

  it('should return a valid ParsedCsvRow for a well-formed row', async () => {
    const csv = [
      HEADERS,
      'John,Smith,john@example.com,555-1234,ADULT,123 Main St,,New York,NY,10001,USA,',
    ].join('\n')

    const rows = await parseCsvFile(makeCsvFile(csv))

    expect(rows).toHaveLength(1)
    const row = rows[0]!
    expect(row.valid).toBe(true)
    expect(row.rowNumber).toBe(2) // first data row → rowNumber 2
    if (row.valid) {
      expect(row.data.firstName).toBe('John')
      expect(row.data.lastName).toBe('Smith')
      expect(row.data.email).toBe('john@example.com')
      expect(row.data.ageGroup).toBe('ADULT')
    }
  })

  it('should return an invalid ParsedCsvRow with error messages for a bad row', async () => {
    const csv = [
      HEADERS,
      ',Doe,not-an-email,,,,,,,,,', // empty firstName + invalid email
    ].join('\n')

    const rows = await parseCsvFile(makeCsvFile(csv))

    expect(rows).toHaveLength(1)
    const row = rows[0]!
    expect(row.valid).toBe(false)
    if (!row.valid) {
      expect(row.errors.length).toBeGreaterThan(0)
      // Should report the firstName error
      expect(row.errors.some((e) => /first name/i.test(e))).toBe(true)
    }
  })

  it('should assign sequential rowNumbers starting at 2', async () => {
    const csv = [
      HEADERS,
      'Alice,Jones,alice@example.com,,,,,,,,,',
      'Bob,Brown,bob@example.com,,,,,,,,,',
    ].join('\n')

    const rows = await parseCsvFile(makeCsvFile(csv))

    expect(rows).toHaveLength(2)
    expect(rows[0]!.rowNumber).toBe(2)
    expect(rows[1]!.rowNumber).toBe(3)
  })

  it('should skip empty lines and return no rows for a header-only file', async () => {
    const csv = HEADERS + '\n'

    const rows = await parseCsvFile(makeCsvFile(csv))

    expect(rows).toHaveLength(0)
  })

  it('should handle a mix of valid and invalid rows', async () => {
    const csv = [
      HEADERS,
      'Alice,Jones,alice@example.com,,,,,,,,,', // valid
      ',Brown,bad-email,,,,,,,,,', // invalid: missing firstName, bad email
    ].join('\n')

    const rows = await parseCsvFile(makeCsvFile(csv))

    expect(rows).toHaveLength(2)
    expect(rows[0]!.valid).toBe(true)
    expect(rows[1]!.valid).toBe(false)
  })

  it('should coerce lowercase ageGroup values when parsing', async () => {
    const csv = [HEADERS, 'Alice,Jones,,,teen,,,,,,,'].join('\n')

    const rows = await parseCsvFile(makeCsvFile(csv))

    expect(rows).toHaveLength(1)
    const row = rows[0]!
    expect(row.valid).toBe(true)
    if (row.valid) {
      expect(row.data.ageGroup).toBe('TEEN')
    }
  })

  it('should expose the raw input on each ParsedCsvRow', async () => {
    const csv = [HEADERS, 'John,Smith,john@example.com,,,,,,,,,'].join('\n')

    const rows = await parseCsvFile(makeCsvFile(csv))

    expect(rows[0]!.raw.firstName).toBe('John')
    expect(rows[0]!.raw.lastName).toBe('Smith')
  })
})
