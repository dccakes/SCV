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

const makeCaller = (opts: { userId?: string | null; headers?: Headers; source?: 'rsc' | 'http' }) =>
  router.createCaller({
    db: {},
    auth: {
      userId: opts.userId ?? null,
      session: null,
      activeOrganization: null,
      activeWeddingId: null,
    },
    headers: opts.headers,
    source: opts.source,
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

    // The route's responseMeta reads `cause.retryAfterSeconds` to set Retry-After.
    await expect(makeCaller({ headers: withIp('1.2.3.4') }).ping()).rejects.toMatchObject({
      code: 'TOO_MANY_REQUESTS',
      cause: { name: 'RateLimitError', retryAfterSeconds: 30 },
    })
  })

  it('does not count in-process server-component reads against the guest IP', async () => {
    await makeCaller({ headers: withIp('1.2.3.4'), source: 'rsc' }).ping()

    expect(mockEnforce).not.toHaveBeenCalled()
  })

  it('still limits the password check from server components', async () => {
    await makeCaller({ headers: withIp('1.2.3.4'), source: 'rsc' }).website.verifyWebsitePassword()

    expect(mockEnforce).toHaveBeenCalledWith(
      'publicTrpcStrict',
      'website.verifyWebsitePassword:1.2.3.4'
    )
  })

  it('limits http callers even if they send an x-trpc-source: rsc header', async () => {
    const headers = withIp('1.2.3.4')
    headers.set('x-trpc-source', 'rsc')

    await makeCaller({ headers }).ping()

    expect(mockEnforce).toHaveBeenCalledWith('publicTrpc', 'ping:1.2.3.4')
  })

  it('skips signed-in users and callers without an IP', async () => {
    await makeCaller({ userId: 'user-1', headers: withIp('1.2.3.4') }).ping()
    await makeCaller({ headers: new Headers() }).ping()
    await makeCaller({}).ping()

    expect(mockEnforce).not.toHaveBeenCalled()
  })

  it('applies the strict password limit to SIGNED-IN users too (accounts are cheap to create)', async () => {
    await makeCaller({
      userId: 'user-1',
      headers: withIp('1.2.3.4'),
    }).website.verifyWebsitePassword()

    expect(mockEnforce).toHaveBeenCalledWith(
      'publicTrpcStrict',
      'website.verifyWebsitePassword:1.2.3.4'
    )
  })

  it('still skips signed-in users for the generous limit', async () => {
    await makeCaller({ userId: 'user-1', headers: withIp('1.2.3.4') }).ping()

    expect(mockEnforce).not.toHaveBeenCalled()
  })

  it('skips even the strict limit for loopback clients (local dev and CI)', async () => {
    await makeCaller({ headers: withIp('127.0.0.1') }).website.verifyWebsitePassword()
    await makeCaller({ headers: withIp('::1') }).website.verifyWebsitePassword()

    expect(mockEnforce).not.toHaveBeenCalled()
  })

  it('lets the request through when the limiter fails open', async () => {
    mockEnforce.mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
      limit: null,
      remaining: 0,
      resetSeconds: 0,
    })

    await expect(makeCaller({ headers: withIp('1.2.3.4') }).ping()).resolves.toBe('pong')
  })
})
