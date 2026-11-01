/** @jest-environment node */

jest.mock('~/lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))
jest.mock('~/server/db', () => ({ db: {} }))
jest.mock('~/server/authz/permission-checker', () => ({ requirePermission: jest.fn() }))

const mockEnforce = jest.fn()
jest.mock('~/server/infrastructure/rate-limit', () => ({
  ...jest.requireActual('~/server/infrastructure/rate-limit/client-ip'),
  RateLimitError: jest.requireActual('~/server/infrastructure/rate-limit/enforce').RateLimitError,
  enforceRateLimit: (...args: unknown[]) => mockEnforce(...args),
}))

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc'

const router = createTRPCRouter({
  ping: publicProcedure.query(() => 'pong'),
  website: createTRPCRouter({ verifyWebsitePassword: publicProcedure.query(() => 'ok') }),
})

const makeCaller = (opts: { userId?: string | null; headers?: Headers }) =>
  router.createCaller({
    db: {},
    auth: {
      userId: opts.userId ?? null,
      session: null,
      activeOrganization: null,
      activeWeddingId: null,
    },
    headers: opts.headers,
  } as never)

const withIp = (ip: string) => new Headers({ 'x-real-ip': ip })

describe('publicProcedure rate limiting', () => {
  beforeEach(() => {
    mockEnforce.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 })
  })

  it('limits anonymous callers per IP and procedure', async () => {
    await makeCaller({ headers: withIp('1.2.3.4') }).ping()

    expect(mockEnforce).toHaveBeenCalledWith('publicTrpc', 'ping:1.2.3.4')
  })

  it('uses the strict policy for the website password check', async () => {
    await makeCaller({ headers: withIp('1.2.3.4') }).website.verifyWebsitePassword()

    expect(mockEnforce).toHaveBeenCalledWith(
      'publicTrpcStrict',
      'website.verifyWebsitePassword:1.2.3.4'
    )
  })

  it('throws TOO_MANY_REQUESTS when over the limit', async () => {
    mockEnforce.mockResolvedValue({ allowed: false, retryAfterSeconds: 30 })

    await expect(makeCaller({ headers: withIp('1.2.3.4') }).ping()).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
    })
  })

  it('skips signed-in users and callers without an IP', async () => {
    await makeCaller({ userId: 'user-1', headers: withIp('1.2.3.4') }).ping()
    await makeCaller({ headers: new Headers() }).ping()
    await makeCaller({}).ping()

    expect(mockEnforce).not.toHaveBeenCalled()
  })
})
