/**
 * Tests for Messaging Domain Validators
 */

import {
  createPairingTokenSchema,
  revokeIdentitySchema,
} from '~/server/domains/messaging/messaging.validator'

describe('createPairingTokenSchema', () => {
  it('accepts channel: telegram', () => {
    const result = createPairingTokenSchema.safeParse({ channel: 'telegram' })
    expect(result.success).toBe(true)
  })

  it('rejects unknown channels', () => {
    const result = createPairingTokenSchema.safeParse({ channel: 'whatsapp' })
    expect(result.success).toBe(false)
  })

  it('rejects missing channel', () => {
    const result = createPairingTokenSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('revokeIdentitySchema', () => {
  it('accepts a non-empty identityId', () => {
    const result = revokeIdentitySchema.safeParse({ identityId: 'identity-123' })
    expect(result.success).toBe(true)
  })

  it('rejects empty identityId', () => {
    const result = revokeIdentitySchema.safeParse({ identityId: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing identityId', () => {
    const result = revokeIdentitySchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
