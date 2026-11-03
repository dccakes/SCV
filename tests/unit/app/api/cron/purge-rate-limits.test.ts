/** @jest-environment node */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const mockDeleteMany = jest.fn()
const mockDeleteAuthLimits = jest.fn()
const mockEnv: { CRON_SECRET?: string } = {}

jest.mock('~/env', () => ({
  env: {
    get CRON_SECRET() {
      return mockEnv.CRON_SECRET
    },
  },
}))
jest.mock('~/server/db', () => ({
  db: {
    rateLimitBucket: { deleteMany: (...a: unknown[]) => mockDeleteMany(...a) },
    rateLimit: { deleteMany: (...a: unknown[]) => mockDeleteAuthLimits(...a) },
  },
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
    mockDeleteAuthLimits.mockResolvedValue({ count: 5 })
  })

  it('rejects requests without the cron secret', async () => {
    expect((await GET(request())).status).toBe(403)
    expect((await GET(request('Bearer wrong'))).status).toBe(403)
    expect(mockDeleteMany).not.toHaveBeenCalled()
    expect(mockDeleteAuthLimits).not.toHaveBeenCalled()
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

      expect(await response.json()).toEqual({ ok: true, deleted: 12, deletedAuthLimits: 5 })
      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: { windowStart: { lt: new Date('2026-11-01T11:00:00Z') } },
      })
    } finally {
      jest.useRealTimers()
    }
  })

  it("also purges Better Auth's rate_limit table, whose lastRequest is epoch milliseconds", async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-01T12:00:00Z'))
    try {
      await GET(request('Bearer secret'))

      // A bigint of epoch ms (not a Date), one hour before now.
      expect(mockDeleteAuthLimits).toHaveBeenCalledWith({
        where: { lastRequest: { lt: BigInt(new Date('2026-11-01T11:00:00Z').getTime()) } },
      })
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('vercel.json cron registration', () => {
  const crons = (
    JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8')) as {
      crons: { path: string; schedule: string }[]
    }
  ).crons

  it('registers the purge so it cannot be silently lost', () => {
    expect(crons).toContainEqual(expect.objectContaining({ path: '/api/cron/purge-rate-limits' }))
  })

  it('runs at most once a day so the deploy is accepted on every Vercel plan', () => {
    const purge = crons.find((cron) => cron.path === '/api/cron/purge-rate-limits')
    const [minute, hour, dayOfMonth, month, dayOfWeek] = (purge?.schedule ?? '').split(' ')

    expect(minute).toMatch(/^\d+$/)
    expect(hour).toMatch(/^\d+$/)
    expect([dayOfMonth, month, dayOfWeek]).toEqual(['*', '*', '*'])
  })
})
