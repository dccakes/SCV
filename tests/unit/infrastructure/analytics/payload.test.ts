import { sanitizePayload } from '~/server/infrastructure/analytics/payload'

describe('sanitizePayload', () => {
  it('returns a plain object payload unchanged when small', () => {
    expect(sanitizePayload({ firstName: 'Ada', rsvp: true })).toEqual({
      firstName: 'Ada',
      rsvp: true,
    })
  })

  it('wraps non-object input under a `value` key', () => {
    expect(sanitizePayload('token-123')).toEqual({ value: 'token-123' })
    expect(sanitizePayload(42)).toEqual({ value: 42 })
  })

  it('returns undefined for null/undefined input', () => {
    expect(sanitizePayload(undefined)).toBeUndefined()
    expect(sanitizePayload(null)).toBeUndefined()
  })

  it('redacts very large string fields (e.g. base64 file blobs)', () => {
    const bigString = 'x'.repeat(20_000)
    const result = sanitizePayload({ name: 'quote.pdf', data: bigString }) as Record<
      string,
      unknown
    >
    expect(result.name).toBe('quote.pdf')
    expect(result.data).toMatch(/\[redacted:/)
  })

  it('caps the total serialized size and marks truncation', () => {
    const many: Record<string, string> = {}
    for (let i = 0; i < 2000; i++) {
      many[`field_${i}`] = 'value-with-some-length'
    }
    const result = sanitizePayload(many) as Record<string, unknown>
    expect(result.__truncated).toBe(true)
  })

  it('never throws on circular structures', () => {
    const circular: Record<string, unknown> = { a: 1 }
    circular.self = circular
    expect(() => sanitizePayload(circular)).not.toThrow()
  })
})
