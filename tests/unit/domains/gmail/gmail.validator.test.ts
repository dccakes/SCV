/**
 * Tests for Gmail Domain Validators
 */

import {
  gmailCallbackSchema,
  gmailCreateDraftSchema,
  gmailGetThreadSchema,
  gmailListMessagesSchema,
  gmailSyncForVendorSchema,
} from '~/server/domains/gmail/gmail.validator'

describe('gmailCallbackSchema', () => {
  it('accepts valid input', () => {
    const result = gmailCallbackSchema.safeParse({
      code: 'auth-code-123',
      state: 'base64-state-string',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty code', () => {
    const result = gmailCallbackSchema.safeParse({ code: '', state: 'valid' })
    expect(result.success).toBe(false)
  })

  it('rejects empty state', () => {
    const result = gmailCallbackSchema.safeParse({ code: 'valid', state: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing fields', () => {
    expect(gmailCallbackSchema.safeParse({}).success).toBe(false)
    expect(gmailCallbackSchema.safeParse({ code: 'valid' }).success).toBe(false)
    expect(gmailCallbackSchema.safeParse({ state: 'valid' }).success).toBe(false)
  })
})

describe('gmailListMessagesSchema', () => {
  it('applies defaults for limit and offset', () => {
    const result = gmailListMessagesSchema.parse({})
    expect(result.limit).toBe(20)
    expect(result.offset).toBe(0)
    expect(result.vendorId).toBeUndefined()
    expect(result.query).toBeUndefined()
  })

  it('accepts valid input with all fields', () => {
    const result = gmailListMessagesSchema.parse({
      vendorId: 'vendor-123',
      query: 'photos',
      limit: 10,
      offset: 5,
    })
    expect(result.vendorId).toBe('vendor-123')
    expect(result.query).toBe('photos')
    expect(result.limit).toBe(10)
    expect(result.offset).toBe(5)
  })

  it('enforces limit bounds', () => {
    expect(gmailListMessagesSchema.safeParse({ limit: 0 }).success).toBe(false)
    expect(gmailListMessagesSchema.safeParse({ limit: 51 }).success).toBe(false)
    expect(gmailListMessagesSchema.safeParse({ limit: 1 }).success).toBe(true)
    expect(gmailListMessagesSchema.safeParse({ limit: 50 }).success).toBe(true)
  })

  it('enforces offset minimum', () => {
    expect(gmailListMessagesSchema.safeParse({ offset: -1 }).success).toBe(false)
    expect(gmailListMessagesSchema.safeParse({ offset: 0 }).success).toBe(true)
  })

  it('rejects non-integer limit and offset', () => {
    expect(gmailListMessagesSchema.safeParse({ limit: 10.5 }).success).toBe(false)
    expect(gmailListMessagesSchema.safeParse({ offset: 1.5 }).success).toBe(false)
  })
})

describe('gmailGetThreadSchema', () => {
  it('accepts valid threadId', () => {
    const result = gmailGetThreadSchema.parse({ threadId: 'thread-abc-123' })
    expect(result.threadId).toBe('thread-abc-123')
  })

  it('rejects empty threadId', () => {
    expect(gmailGetThreadSchema.safeParse({ threadId: '' }).success).toBe(false)
  })

  it('rejects missing threadId', () => {
    expect(gmailGetThreadSchema.safeParse({}).success).toBe(false)
  })
})

describe('gmailCreateDraftSchema', () => {
  const validDraft = {
    threadId: 'thread-123',
    to: 'vendor@example.com',
    subject: 'Hello',
    body: 'Message body',
  }

  it('accepts valid input', () => {
    const result = gmailCreateDraftSchema.parse(validDraft)
    expect(result.to).toBe('vendor@example.com')
    expect(result.inReplyTo).toBeUndefined()
  })

  it('accepts input with optional inReplyTo', () => {
    const result = gmailCreateDraftSchema.parse({
      ...validDraft,
      inReplyTo: '<msg-id@gmail.com>',
    })
    expect(result.inReplyTo).toBe('<msg-id@gmail.com>')
  })

  it('rejects invalid email', () => {
    expect(
      gmailCreateDraftSchema.safeParse({ ...validDraft, to: 'not-an-email' }).success
    ).toBe(false)
  })

  it('rejects empty subject', () => {
    expect(
      gmailCreateDraftSchema.safeParse({ ...validDraft, subject: '' }).success
    ).toBe(false)
  })

  it('rejects empty body', () => {
    expect(
      gmailCreateDraftSchema.safeParse({ ...validDraft, body: '' }).success
    ).toBe(false)
  })

  it('rejects empty threadId', () => {
    expect(
      gmailCreateDraftSchema.safeParse({ ...validDraft, threadId: '' }).success
    ).toBe(false)
  })

  it('rejects missing required fields', () => {
    expect(gmailCreateDraftSchema.safeParse({}).success).toBe(false)
    expect(gmailCreateDraftSchema.safeParse({ to: 'a@b.com' }).success).toBe(false)
  })
})

describe('gmailSyncForVendorSchema', () => {
  it('accepts valid vendorId', () => {
    const result = gmailSyncForVendorSchema.parse({ vendorId: 'vendor-123' })
    expect(result.vendorId).toBe('vendor-123')
  })

  it('rejects empty vendorId', () => {
    expect(gmailSyncForVendorSchema.safeParse({ vendorId: '' }).success).toBe(false)
  })

  it('rejects missing vendorId', () => {
    expect(gmailSyncForVendorSchema.safeParse({}).success).toBe(false)
  })
})
