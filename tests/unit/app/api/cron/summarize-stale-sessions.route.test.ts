/**
 * @jest-environment node
 *
 * Tests for GET /api/cron/summarize-stale-sessions — secret check + sweep wiring.
 */

jest.mock('~/env', () => ({
  env: {
    CRON_SECRET: 'expected-cron-secret',
    TELEGRAM_SESSION_GAP_MS: 60_000,
  },
}))

const mockSweepStale = jest.fn()
jest.mock('~/server/application/messaging', () => ({
  getSessionSummarizer: () => ({ sweepStale: mockSweepStale }),
  getStaleSessionGapMs: () => 60_000,
}))

import { GET } from '~/app/api/cron/summarize-stale-sessions/route'

const reqWith = (auth?: string) =>
  new Request('http://localhost/api/cron/summarize-stale-sessions', {
    method: 'GET',
    headers: auth ? { authorization: auth } : {},
  })

describe('GET /api/cron/summarize-stale-sessions', () => {
  beforeEach(() => {
    mockSweepStale.mockReset()
    mockSweepStale.mockResolvedValue(3)
  })

  it('returns 403 when the authorization header is missing', async () => {
    const res = await GET(reqWith())
    expect(res.status).toBe(403)
    expect(mockSweepStale).not.toHaveBeenCalled()
  })

  it('returns 403 when the authorization header is wrong', async () => {
    const res = await GET(reqWith('Bearer wrong'))
    expect(res.status).toBe(403)
  })

  it('invokes sweepStale and returns the count when authorised', async () => {
    const res = await GET(reqWith('Bearer expected-cron-secret'))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok: boolean; summarized: number }
    expect(body).toEqual({ ok: true, summarized: 3 })
    expect(mockSweepStale).toHaveBeenCalledWith({ olderThanMs: 60_000 })
  })
})
