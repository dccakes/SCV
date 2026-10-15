/**
 * @jest-environment node
 */
const mockBuildNodeOTelConfig = jest.fn(() => ({ serviceName: 'scv', nodeConfig: true }))
const mockCaptureServerException = jest.fn()
const mockLoggerError = jest.fn()

jest.mock('@vercel/otel', () => ({ registerOTel: jest.fn() }))
jest.mock('~/server/infrastructure/observability/node-otel', () => ({
  buildNodeOTelConfig: () => mockBuildNodeOTelConfig(),
}))
jest.mock('~/server/infrastructure/observability/capture-exception', () => ({
  captureServerException: (...args: unknown[]) => mockCaptureServerException(...args),
}))
jest.mock('~/lib/observability/logger', () => ({
  logger: { error: (...args: unknown[]) => mockLoggerError(...args) },
}))

import { registerOTel } from '@vercel/otel'

import { onRequestError, register } from '~/instrumentation'

const originalRuntime = process.env.NEXT_RUNTIME

afterEach(() => {
  process.env.NEXT_RUNTIME = originalRuntime
})

const requestError = Object.assign(new Error('request failed'), { digest: 'digest-123' })
const request = {
  method: 'GET',
  path: '/events?invite=secret',
  headers: { 'x-posthog-distinct-id': 'user_1', 'x-posthog-session-id': 'session_1' },
}
const requestContext = {
  routePath: '/events',
  routeType: 'render',
  routerKind: 'App Router',
} as const

const expectedAttributes = {
  'error.digest': 'digest-123',
  'http.request.method': 'GET',
  'url.path': '/events',
  'next.route': '/events',
  'next.route_type': 'render',
  'next.router_kind': 'App Router',
}

describe('register', () => {
  it('registers the full Node.js config (PostHog exporters, Prisma) in the Node runtime', async () => {
    process.env.NEXT_RUNTIME = 'nodejs'
    await register()
    expect(registerOTel).toHaveBeenCalledWith({ serviceName: 'scv', nodeConfig: true })
  })

  it('registers the default config in the Edge runtime', async () => {
    process.env.NEXT_RUNTIME = 'edge'
    await register()
    expect(mockBuildNodeOTelConfig).not.toHaveBeenCalled()
    expect(registerOTel).toHaveBeenCalledWith({ serviceName: 'scv' })
  })
})

describe('onRequestError', () => {
  it('logs through the OTel logger without leaking query strings', async () => {
    process.env.NEXT_RUNTIME = 'edge'
    await onRequestError(requestError, request, requestContext)

    expect(mockLoggerError).toHaveBeenCalledWith(
      'Unhandled request error',
      expectedAttributes,
      requestError
    )
    expect(mockCaptureServerException).not.toHaveBeenCalled()
  })

  it('reports to PostHog error tracking with person and session in Node.js', async () => {
    process.env.NEXT_RUNTIME = 'nodejs'
    await onRequestError(requestError, request, requestContext)

    expect(mockCaptureServerException).toHaveBeenCalledWith(requestError, {
      distinctId: 'user_1',
      sessionId: 'session_1',
      properties: { ...expectedAttributes, source: 'next-on-request-error' },
    })
  })
})
