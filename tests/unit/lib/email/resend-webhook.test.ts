import { createHmac } from 'node:crypto'
import {
  isInboundEventType,
  normalizeInboundEmail,
  resendWebhookSchema,
  verifyResendSignature,
} from '~/lib/email/resend-webhook'

const SECRET = `whsec_${Buffer.from('super-secret-key-for-tests').toString('base64')}`

function sign(payload: string, id: string, timestamp: string): string {
  const secretBytes = Buffer.from(SECRET.replace(/^whsec_/, ''), 'base64')
  const signedContent = `${id}.${timestamp}.${payload}`
  const sig = createHmac('sha256', secretBytes).update(signedContent).digest('base64')
  return `v1,${sig}`
}

describe('verifyResendSignature', () => {
  const payload = JSON.stringify({ type: 'email.received', data: {} })
  const now = 1_700_000_000_000
  const timestamp = String(Math.floor(now / 1000))
  const svixId = 'msg_123'

  it('accepts a correctly signed payload within tolerance', () => {
    const signature = sign(payload, svixId, timestamp)
    expect(
      verifyResendSignature({
        secret: SECRET,
        payload,
        svixId,
        svixTimestamp: timestamp,
        svixSignature: signature,
        now,
      })
    ).toBe(true)
  })

  it('rejects a tampered payload', () => {
    const signature = sign(payload, svixId, timestamp)
    expect(
      verifyResendSignature({
        secret: SECRET,
        payload: `${payload} tampered`,
        svixId,
        svixTimestamp: timestamp,
        svixSignature: signature,
        now,
      })
    ).toBe(false)
  })

  it('rejects a stale timestamp beyond tolerance', () => {
    const signature = sign(payload, svixId, timestamp)
    expect(
      verifyResendSignature({
        secret: SECRET,
        payload,
        svixId,
        svixTimestamp: timestamp,
        svixSignature: signature,
        now: now + 10 * 60 * 1000, // 10 minutes later
      })
    ).toBe(false)
  })

  it('rejects when headers are missing', () => {
    expect(
      verifyResendSignature({
        secret: SECRET,
        payload,
        svixId: null,
        svixTimestamp: null,
        svixSignature: null,
        now,
      })
    ).toBe(false)
  })

  it('skips verification (returns true) when no secret is configured', () => {
    expect(
      verifyResendSignature({
        secret: undefined,
        payload,
        svixId: null,
        svixTimestamp: null,
        svixSignature: null,
        now,
      })
    ).toBe(true)
  })

  it('matches when the header carries multiple space-delimited signatures', () => {
    const good = sign(payload, svixId, timestamp)
    const header = `v1,bogussignature ${good}`
    expect(
      verifyResendSignature({
        secret: SECRET,
        payload,
        svixId,
        svixTimestamp: timestamp,
        svixSignature: header,
        now,
      })
    ).toBe(true)
  })
})

describe('isInboundEventType', () => {
  it('accepts inbound event types and undefined', () => {
    expect(isInboundEventType('email.received')).toBe(true)
    expect(isInboundEventType('inbound.email.received')).toBe(true)
    expect(isInboundEventType(undefined)).toBe(true)
  })

  it('rejects unrelated event types', () => {
    expect(isInboundEventType('email.delivered')).toBe(false)
    expect(isInboundEventType('email.bounced')).toBe(false)
  })
})

describe('normalizeInboundEmail', () => {
  it('normalizes string addresses in "Name <email>" form', () => {
    const parsed = resendWebhookSchema.parse({
      type: 'email.received',
      data: {
        email_id: 'in_abc',
        from: 'Acme Florals <hello@acmeflorals.com>',
        to: 'jane-and-john@w.oswp.carvallo.io',
        subject: 'Your floral contract',
        text: 'Please find the contract attached.',
        message_id: '<msg-1@acmeflorals.com>',
      },
    })
    const email = normalizeInboundEmail(parsed)
    expect(email).not.toBeNull()
    expect(email?.providerId).toBe('in_abc')
    expect(email?.fromAddress).toBe('hello@acmeflorals.com')
    expect(email?.fromName).toBe('Acme Florals')
    expect(email?.to).toEqual(['jane-and-john@w.oswp.carvallo.io'])
    expect(email?.subject).toBe('Your floral contract')
    expect(email?.messageIdHeader).toBe('<msg-1@acmeflorals.com>')
  })

  it('normalizes object addresses and attachment arrays', () => {
    const parsed = resendWebhookSchema.parse({
      type: 'email.received',
      data: {
        id: 'in_def',
        from: { name: 'Guest Person', email: 'guest@example.com' },
        to: [{ email: 'jane-and-john@w.oswp.carvallo.io' }],
        cc: [{ email: 'planner@example.com' }],
        subject: 'RSVP question',
        attachments: [
          {
            filename: 'menu.pdf',
            content_type: 'application/pdf',
            size: 1024,
            url: 'https://x/menu.pdf',
          },
        ],
      },
    })
    const email = normalizeInboundEmail(parsed)
    expect(email?.fromAddress).toBe('guest@example.com')
    expect(email?.fromName).toBe('Guest Person')
    expect(email?.cc).toEqual(['planner@example.com'])
    expect(email?.attachments).toHaveLength(1)
    expect(email?.attachments[0]).toMatchObject({
      filename: 'menu.pdf',
      contentType: 'application/pdf',
      size: 1024,
      url: 'https://x/menu.pdf',
    })
  })

  it('defaults a missing subject and returns null without a sender', () => {
    const parsed = resendWebhookSchema.parse({
      type: 'email.received',
      data: { email_id: 'in_ghi', to: 'jane-and-john@w.oswp.carvallo.io' },
    })
    expect(normalizeInboundEmail(parsed)).toBeNull()
  })

  it('captures the Resend conversation id for thread grouping', () => {
    const parsed = resendWebhookSchema.parse({
      type: 'email.received',
      data: {
        email_id: 'in_jkl',
        conversation_id: 'conv_789',
        from: 'hello@acmeflorals.com',
        to: 'jane-and-john@w.oswp.carvallo.io',
        subject: 'Re: Your floral contract',
      },
    })
    expect(normalizeInboundEmail(parsed)?.conversationId).toBe('conv_789')
  })

  it('leaves conversationId undefined when absent', () => {
    const parsed = resendWebhookSchema.parse({
      type: 'email.received',
      data: {
        email_id: 'in_mno',
        from: 'hello@acmeflorals.com',
        to: 'jane-and-john@w.oswp.carvallo.io',
        subject: 'Hello',
      },
    })
    expect(normalizeInboundEmail(parsed)?.conversationId).toBeUndefined()
  })
})
