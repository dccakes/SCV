/** @jest-environment node */

const mockDeleteMany = jest.fn()
const mockEnv: { CRON_SECRET?: string } = {}

jest.mock('~/env', () => ({
  env: {
    get CRON_SECRET() {
      return mockEnv.CRON_SECRET
    },
  },
}))
jest.mock('~/server/db', () => ({
  db: { rateLimitBucket: { deleteMany: (...a: unknown[]) => mockDeleteMany(...a) } },
}))

import { GET } from '~/app/api/cron/purge-rate-limits/route'

const request = (authorization?: string) =>
  new Request('https://example.com/api/cron/purge-rate-limits', {
    headers: authorization ? { authorization } : {},
  })

describe('GET /api/cron/purge-rate-limits', () => {
  beforeEach(() => {
    mockEnv.CRON_SECRET = 'secret'
    mockDeleteMany.mockResolvedValue({ count: 12 })
  })

  it('rejects requests without the cron secret', async () => {
    expect((await GET(request())).status).toBe(403)
    expect((await GET(request('Bearer wrong'))).status).toBe(403)
    expect(mockDeleteMany).not.toHaveBeenCalled()
  })

  it('rejects everything when no secret is configured', async () => {
    mockEnv.CRON_SECRET = undefined

    expect((await GET(request('Bearer undefined'))).status).toBe(403)
    expect(mockDeleteMany).not.toHaveBeenCalled()
  })

  it('deletes buckets whose window ended over an hour ago and reports the count', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-01T12:00:00Z'))
    try {
      const response = await GET(request('Bearer secret'))

      expect(await response.json()).toEqual({ ok: true, deleted: 12 })
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: { windowStart: { lt: new Date('2026-11-01T11:00:00Z') } },
      })
    } finally {
      jest.useRealTimers()
    }
  })
})
