/**
 * Tests for Vendor Domain Validators
 */

import {
  createQuoteSchema,
  createVendorSchema,
  deleteQuoteFileSchema,
  deleteQuoteSchema,
  deleteVendorSchema,
  saveQuoteFilesSchema,
  updateQuoteSchema,
  updateVendorSchema,
  updateVendorStatusSchema,
} from '~/server/domains/vendor/vendor.validator'

describe('createVendorSchema', () => {
  it('should validate a minimal valid vendor (name + category)', () => {
    const result = createVendorSchema.safeParse({ category: 'PHOTOGRAPHER', name: 'Alice Photos' })
    expect(result.success).toBe(true)
  })

  it('should validate a vendor with all fields', () => {
    const input = {
      category: 'VENUE',
      name: 'Grand Hall',
      location: 'New York, NY',
      website: 'https://grandhall.com',
      instagram: '@grandhall',
      contactName: 'Jane Smith',
      contactEmail: 'jane@grandhall.com',
      contactPhone: '+1234567890',
    }
    const result = createVendorSchema.safeParse(input)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(input)
  })

  it('should reject missing name', () => {
    const result = createVendorSchema.safeParse({ category: 'CATERING' })
    expect(result.success).toBe(false)
  })

  it('should reject empty name', () => {
    const result = createVendorSchema.safeParse({ category: 'MUSIC', name: '' })
    expect(result.success).toBe(false)
  })

  it('should reject name longer than 100 characters', () => {
    const result = createVendorSchema.safeParse({
      category: 'FLOWERS',
      name: 'A'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid category', () => {
    const result = createVendorSchema.safeParse({ category: 'INVALID', name: 'Test' })
    expect(result.success).toBe(false)
  })

  it('should reject invalid website URL', () => {
    const result = createVendorSchema.safeParse({
      category: 'VIDEOGRAPHER',
      name: 'Video Co',
      website: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('should allow empty string for website (cleared field)', () => {
    const result = createVendorSchema.safeParse({
      category: 'OTHER',
      name: 'Test Vendor',
      website: '',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid contact email', () => {
    const result = createVendorSchema.safeParse({
      category: 'VENUE',
      name: 'Test',
      contactEmail: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('should allow empty string for contactEmail (cleared field)', () => {
    const result = createVendorSchema.safeParse({
      category: 'VENUE',
      name: 'Test',
      contactEmail: '',
    })
    expect(result.success).toBe(true)
  })

  it('should accept all valid categories', () => {
    const categories = [
      'VENUE',
      'CATERING',
      'PHOTOGRAPHER',
      'VIDEOGRAPHER',
      'MUSIC',
      'FLOWERS',
      'OTHER',
    ]
    for (const category of categories) {
      const result = createVendorSchema.safeParse({ category, name: 'Test' })
      expect(result.success).toBe(true)
    }
  })

  it('should reject location longer than 200 characters', () => {
    const result = createVendorSchema.safeParse({
      category: 'VENUE',
      name: 'Test',
      location: 'A'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('should reject instagram longer than 100 characters', () => {
    const result = createVendorSchema.safeParse({
      category: 'VENUE',
      name: 'Test',
      instagram: `@${'a'.repeat(100)}`,
    })
    expect(result.success).toBe(false)
  })

  it('should reject contactName longer than 100 characters', () => {
    const result = createVendorSchema.safeParse({
      category: 'VENUE',
      name: 'Test',
      contactName: 'A'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('should reject contactPhone longer than 30 characters', () => {
    const result = createVendorSchema.safeParse({
      category: 'VENUE',
      name: 'Test',
      contactPhone: '1'.repeat(31),
    })
    expect(result.success).toBe(false)
  })
})

describe('updateVendorSchema', () => {
  it('should validate with only vendorId', () => {
    const result = updateVendorSchema.safeParse({ vendorId: 'vendor-123' })
    expect(result.success).toBe(true)
  })

  it('should validate with partial fields', () => {
    const result = updateVendorSchema.safeParse({
      vendorId: 'vendor-123',
      name: 'Updated Name',
      location: 'London, UK',
    })
    expect(result.success).toBe(true)
  })

  it('should require vendorId', () => {
    const result = updateVendorSchema.safeParse({ name: 'Test' })
    expect(result.success).toBe(false)
  })

  it('should reject empty vendorId', () => {
    const result = updateVendorSchema.safeParse({ vendorId: '', name: 'Test' })
    expect(result.success).toBe(false)
  })
})

describe('updateVendorStatusSchema', () => {
  it('should validate all valid statuses', () => {
    const statuses = [
      'NOT_AVAILABLE',
      'DECLINED',
      'IN_REVIEW',
      'PRE_SELECTED',
      'IN_NEGOTIATION',
      'SELECTED',
    ]
    for (const status of statuses) {
      const result = updateVendorStatusSchema.safeParse({ vendorId: 'vendor-123', status })
      expect(result.success).toBe(true)
    }
  })

  it('should reject invalid status', () => {
    const result = updateVendorStatusSchema.safeParse({ vendorId: 'vendor-123', status: 'PENDING' })
    expect(result.success).toBe(false)
  })

  it('should require vendorId', () => {
    const result = updateVendorStatusSchema.safeParse({ status: 'SELECTED' })
    expect(result.success).toBe(false)
  })
})

describe('deleteVendorSchema', () => {
  it('should validate valid vendorId', () => {
    const result = deleteVendorSchema.safeParse({ vendorId: 'vendor-123' })
    expect(result.success).toBe(true)
  })

  it('should reject missing vendorId', () => {
    const result = deleteVendorSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('should reject empty vendorId', () => {
    const result = deleteVendorSchema.safeParse({ vendorId: '' })
    expect(result.success).toBe(false)
  })
})

describe('createQuoteSchema', () => {
  it('should validate a valid quote', () => {
    const input = {
      vendorId: 'vendor-123',
      price: 1500.0,
      quoteDate: '2026-03-01',
      notes: 'Includes travel',
    }
    const result = createQuoteSchema.safeParse(input)
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ ...input, quoteType: 'FLAT_FEE' })
  })

  it('should validate without optional notes', () => {
    const result = createQuoteSchema.safeParse({
      vendorId: 'vendor-123',
      price: 500,
      quoteDate: '2026-03-01',
    })
    expect(result.success).toBe(true)
  })

  it('should reject zero price', () => {
    const result = createQuoteSchema.safeParse({
      vendorId: 'vendor-123',
      price: 0,
      quoteDate: '2026-03-01',
    })
    expect(result.success).toBe(false)
  })

  it('should reject negative price', () => {
    const result = createQuoteSchema.safeParse({
      vendorId: 'vendor-123',
      price: -100,
      quoteDate: '2026-03-01',
    })
    expect(result.success).toBe(false)
  })

  it('should require vendorId', () => {
    const result = createQuoteSchema.safeParse({ price: 500, quoteDate: '2026-03-01' })
    expect(result.success).toBe(false)
  })

  it('should require quoteDate', () => {
    const result = createQuoteSchema.safeParse({ vendorId: 'vendor-123', price: 500 })
    expect(result.success).toBe(false)
  })

  it('should reject quoteDate not in YYYY-MM-DD format', () => {
    const invalid = ['03/01/2026', '2026/03/01', '01-03-2026', 'March 1 2026', '2026-3-1']
    for (const date of invalid) {
      const result = createQuoteSchema.safeParse({
        vendorId: 'vendor-123',
        price: 500,
        quoteDate: date,
      })
      expect(result.success).toBe(false)
    }
  })

  it('should accept quoteDate in YYYY-MM-DD format', () => {
    const result = createQuoteSchema.safeParse({
      vendorId: 'vendor-123',
      price: 500,
      quoteDate: '2026-03-01',
    })
    expect(result.success).toBe(true)
  })

  it('should reject price above $10,000,000', () => {
    const result = createQuoteSchema.safeParse({
      vendorId: 'vendor-123',
      price: 10_000_001,
      quoteDate: '2026-03-01',
    })
    expect(result.success).toBe(false)
  })

  it('should reject notes longer than 5000 characters', () => {
    const result = createQuoteSchema.safeParse({
      vendorId: 'vendor-123',
      price: 500,
      quoteDate: '2026-03-01',
      notes: 'A'.repeat(5001),
    })
    expect(result.success).toBe(false)
  })

  it('should accept PER_GUEST quoteType', () => {
    const result = createQuoteSchema.safeParse({
      vendorId: 'vendor-123',
      price: 75,
      quoteType: 'PER_GUEST',
      quoteDate: '2026-03-01',
    })
    expect(result.success).toBe(true)
    expect(result.data?.quoteType).toBe('PER_GUEST')
  })

  it('should reject invalid quoteType', () => {
    const result = createQuoteSchema.safeParse({
      vendorId: 'vendor-123',
      price: 75,
      quoteType: 'HOURLY',
      quoteDate: '2026-03-01',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateQuoteSchema', () => {
  it('should validate with required fields only', () => {
    const result = updateQuoteSchema.safeParse({
      quoteId: 'quote-123',
      vendorId: 'vendor-123',
    })
    expect(result.success).toBe(true)
  })

  it('should validate with partial update fields', () => {
    const result = updateQuoteSchema.safeParse({
      quoteId: 'quote-123',
      vendorId: 'vendor-123',
      price: 2000,
    })
    expect(result.success).toBe(true)
  })

  it('should accept optional quoteType PER_GUEST', () => {
    const result = updateQuoteSchema.safeParse({
      quoteId: 'quote-123',
      vendorId: 'vendor-123',
      quoteType: 'PER_GUEST',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid quoteType on update', () => {
    const result = updateQuoteSchema.safeParse({
      quoteId: 'quote-123',
      vendorId: 'vendor-123',
      quoteType: 'INVALID',
    })
    expect(result.success).toBe(false)
  })

  it('should require quoteId', () => {
    const result = updateQuoteSchema.safeParse({ vendorId: 'vendor-123', price: 500 })
    expect(result.success).toBe(false)
  })

  it('should require vendorId', () => {
    const result = updateQuoteSchema.safeParse({ quoteId: 'quote-123', price: 500 })
    expect(result.success).toBe(false)
  })

  it('should reject zero price when provided', () => {
    const result = updateQuoteSchema.safeParse({
      quoteId: 'quote-123',
      vendorId: 'vendor-123',
      price: 0,
    })
    expect(result.success).toBe(false)
  })
})

describe('deleteQuoteSchema', () => {
  it('should validate valid ids', () => {
    const result = deleteQuoteSchema.safeParse({ quoteId: 'quote-123', vendorId: 'vendor-123' })
    expect(result.success).toBe(true)
  })

  it('should require quoteId', () => {
    const result = deleteQuoteSchema.safeParse({ vendorId: 'vendor-123' })
    expect(result.success).toBe(false)
  })

  it('should require vendorId', () => {
    const result = deleteQuoteSchema.safeParse({ quoteId: 'quote-123' })
    expect(result.success).toBe(false)
  })
})

describe('saveQuoteFilesSchema', () => {
  const validInput = {
    quoteId: 'quote-123',
    vendorId: 'vendor-123',
    files: [
      {
        name: 'proposal.pdf',
        url: 'https://abc123.public.blob.vercel-storage.com/proposal.pdf',
        key: 'abc123',
        size: 102400,
      },
    ],
  }

  it('should validate a valid input with one file', () => {
    const result = saveQuoteFilesSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('should validate with multiple files', () => {
    const input = {
      ...validInput,
      files: [
        {
          name: 'file1.pdf',
          url: 'https://abc123.public.blob.vercel-storage.com/file1.pdf',
          key: 'a',
          size: 100,
        },
        {
          name: 'file2.jpg',
          url: 'https://abc123.public.blob.vercel-storage.com/file2.jpg',
          key: 'b',
          size: 200,
        },
      ],
    }
    const result = saveQuoteFilesSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('should reject empty files array', () => {
    const result = saveQuoteFilesSchema.safeParse({ ...validInput, files: [] })
    expect(result.success).toBe(false)
  })

  it('should reject more than 10 files', () => {
    const files = Array.from({ length: 11 }, (_, i) => ({
      name: `file${i}.pdf`,
      url: `https://abc123.public.blob.vercel-storage.com/file${i}.pdf`,
      key: `key${i}`,
      size: 100,
    }))
    const result = saveQuoteFilesSchema.safeParse({ ...validInput, files })
    expect(result.success).toBe(false)
  })

  it('should require quoteId', () => {
    const { quoteId: _, ...rest } = validInput
    const result = saveQuoteFilesSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('should require vendorId', () => {
    const { vendorId: _, ...rest } = validInput
    const result = saveQuoteFilesSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('should reject file with invalid url', () => {
    const input = {
      ...validInput,
      files: [{ name: 'file.pdf', url: 'not-a-url', key: 'abc', size: 100 }],
    }
    const result = saveQuoteFilesSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('should reject file with non-Vercel-Blob url', () => {
    const input = {
      ...validInput,
      files: [{ name: 'file.pdf', url: 'https://evil.com/malware.pdf', key: 'abc', size: 100 }],
    }
    const result = saveQuoteFilesSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('should reject file with empty name', () => {
    const input = {
      ...validInput,
      files: [
        {
          name: '',
          url: 'https://abc123.public.blob.vercel-storage.com/f.pdf',
          key: 'abc',
          size: 100,
        },
      ],
    }
    const result = saveQuoteFilesSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('should sanitize path traversal in filename', () => {
    const input = {
      ...validInput,
      files: [
        {
          name: '../../../etc/passwd',
          url: 'https://abc123.public.blob.vercel-storage.com/f.pdf',
          key: 'abc',
          size: 100,
        },
      ],
    }
    const result = saveQuoteFilesSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.files[0]?.name).toBe('etcpasswd')
    }
  })

  it('should reject file with zero size', () => {
    const input = {
      ...validInput,
      files: [
        {
          name: 'file.pdf',
          url: 'https://abc123.public.blob.vercel-storage.com/f.pdf',
          key: 'abc',
          size: 0,
        },
      ],
    }
    const result = saveQuoteFilesSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})

describe('deleteQuoteFileSchema', () => {
  it('should validate valid input', () => {
    const result = deleteQuoteFileSchema.safeParse({
      fileId: 'file-123',
      quoteId: 'quote-123',
      vendorId: 'vendor-123',
    })
    expect(result.success).toBe(true)
  })

  it('should require fileId', () => {
    const result = deleteQuoteFileSchema.safeParse({
      quoteId: 'quote-123',
      vendorId: 'vendor-123',
    })
    expect(result.success).toBe(false)
  })

  it('should require quoteId', () => {
    const result = deleteQuoteFileSchema.safeParse({
      fileId: 'file-123',
      vendorId: 'vendor-123',
    })
    expect(result.success).toBe(false)
  })

  it('should require vendorId', () => {
    const result = deleteQuoteFileSchema.safeParse({
      fileId: 'file-123',
      quoteId: 'quote-123',
    })
    expect(result.success).toBe(false)
  })

  it('should reject empty fileId', () => {
    const result = deleteQuoteFileSchema.safeParse({
      fileId: '',
      quoteId: 'quote-123',
      vendorId: 'vendor-123',
    })
    expect(result.success).toBe(false)
  })
})
