/**
 * @jest-environment node
 *
 * Tests for POST /api/webhooks/telegram — secret check, rate limit, handler scheduling.
 */

// Capture callbacks passed to next/server's `after()` so we can drive the async work.
const scheduled: Array<() => Promise<void>> = []
jest.mock('next/server', () => ({
  after: (cb: () => Promise<void>) => {
    scheduled.push(cb)
  },
}))

jest.mock('~/env', () => ({
  env: {
    TELEGRAM_WEBHOOK_SECRET: 'expected-secret',
    TELEGRAM_BOT_TOKEN: 'bot-token',
  },
}))

const mockHandle = jest.fn()
const mockCheck = jest.fn()

jest.mock('~/server/application/messaging', () => ({
  getTelegramHandler: () => ({ handle: mockHandle }),
  getTelegramRateLimiter: () => ({ check: mockCheck }),
}))

import { POST } from '~/app/api/webhooks/telegram/route'

function buildRequest(opts: { secret?: string; body?: unknown; badJson?: boolean } = {}) {
  const headers = new Headers()
  if (opts.secret !== null && opts.secret !== undefined) {
    headers.set('x-telegram-bot-api-secret-token', opts.secret)
  }
  const body = opts.badJson ? 'not-json' : JSON.stringify(opts.body ?? {})
  return new Request('http://localhost/api/webhooks/telegram', {
    method: 'POST',
    headers,
    body,
  })
}

describe('POST /api/webhooks/telegram', () => {
  beforeEach(() => {
    scheduled.length = 0
    mockHandle.mockReset()
    mockCheck.mockReset()
    mockCheck.mockResolvedValue(true)
  })

  it('returns 403 when the secret header is missing', async () => {
    const res = await POST(
      new Request('http://localhost/api/webhooks/telegram', { method: 'POST', body: '{}' })
    )
    expect(res.status).toBe(403)
    expect(mockHandle).not.toHaveBeenCalled()
  })

  it('returns 403 when the secret header is wrong', async () => {
    const res = await POST(buildRequest({ secret: 'wrong', body: {} }))
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid JSON payloads', async () => {
    const res = await POST(buildRequest({ secret: 'expected-secret', badJson: true }))
    expect(res.status).toBe(400)
    expect(mockHandle).not.toHaveBeenCalled()
  })

  it('schedules the handler and returns 200 for a valid payload', async () => {
    const update = { update_id: 1, message: { message_id: 1, chat: { id: 42, type: 'private' } } }
    const res = await POST(buildRequest({ secret: 'expected-secret', body: update }))
    expect(res.status).toBe(200)
    expect(scheduled).toHaveLength(1)

    const cb = scheduled[0]
    if (!cb) throw new Error('expected a scheduled callback')
    await cb()
    expect(mockHandle).toHaveBeenCalledWith(update)
  })

  it('silently drops rate-limited chats', async () => {
    mockCheck.mockResolvedValue(false)
    const update = { update_id: 1, message: { message_id: 1, chat: { id: 42, type: 'private' } } }
    const res = await POST(buildRequest({ secret: 'expected-secret', body: update }))
    expect(res.status).toBe(200)
    expect(scheduled).toHaveLength(0)
  })
})
