/**
 * @jest-environment node
 */
jest.mock('@vercel/otel', () => ({
  OTLPHttpProtoTraceExporter: jest.fn().mockImplementation((config: unknown) => ({ config })),
}))
jest.mock('@opentelemetry/exporter-logs-otlp-http', () => ({
  OTLPLogExporter: jest.fn().mockImplementation(() => ({
    export: (_logs: unknown, done: (result: { code: number }) => void) => done({ code: 0 }),
    shutdown: () => Promise.resolve(),
    forceFlush: () => Promise.resolve(),
  })),
}))

import { logs } from '@opentelemetry/api-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import {
  BatchLogRecordProcessor,
  InMemoryLogRecordExporter,
  LoggerProvider,
  type LogRecordProcessor,
} from '@opentelemetry/sdk-logs'
import { PrismaInstrumentation } from '@prisma/instrumentation'
import { OTLPHttpProtoTraceExporter } from '@vercel/otel'

import {
  buildNodeOTelConfig,
  flushLogsPerRequest,
  redactUrlQueries,
} from '~/server/infrastructure/observability/node-otel'

const ignoreUrls = (config: ReturnType<typeof buildNodeOTelConfig>) =>
  config.instrumentationConfig?.fetch?.ignoreUrls ?? []

const isIgnored = (config: ReturnType<typeof buildNodeOTelConfig>, url: string) =>
  ignoreUrls(config).some((matcher) =>
    typeof matcher === 'string' ? url.startsWith(matcher) : matcher.test(url)
  )

describe('buildNodeOTelConfig', () => {
  it('keeps @vercel/otel defaults and adds Prisma spans when PostHog is not configured', () => {
    const config = buildNodeOTelConfig({ VERCEL_GIT_COMMIT_SHA: 'abc123' })

    expect(config.serviceName).toBe('scv')
    expect(config.attributes).toMatchObject({ 'service.version': 'abc123' })
    expect(config.instrumentations?.[0]).toBe('auto')
    expect(config.instrumentations?.[1]).toBeInstanceOf(PrismaInstrumentation)
    expect(config.traceExporter).toBeUndefined()
    expect(config.logRecordProcessors).toBeUndefined()
    expect(config.spanProcessors).toHaveLength(2)
    expect(config.spanProcessors?.[1]).toBe('auto')
  })

  it('maps PostHog tracing headers onto root span attributes', () => {
    expect(buildNodeOTelConfig({}).attributesFromHeaders).toEqual({
      posthogDistinctId: 'x-posthog-distinct-id',
      sessionId: 'x-posthog-session-id',
    })
  })

  it('exports traces and logs to PostHog with the project token', () => {
    const config = buildNodeOTelConfig({ POSTHOG_KEY: 'phc_test' })

    expect(OTLPHttpProtoTraceExporter).toHaveBeenCalledWith({
      url: 'https://us.i.posthog.com/i/v1/traces',
      headers: { Authorization: 'Bearer phc_test' },
    })
    expect(OTLPLogExporter).toHaveBeenCalledWith({
      url: 'https://us.i.posthog.com/i/v1/logs',
      headers: { Authorization: 'Bearer phc_test' },
    })
    expect(config.logRecordProcessors).toHaveLength(1)
    // Log flushing no longer rides on span processing (sampled-out requests).
    expect(config.spanProcessors).toHaveLength(2)
    expect(config.spanProcessors?.[1]).toBe('auto')
  })

  it('never traces its own telemetry uploads', () => {
    const config = buildNodeOTelConfig({
      POSTHOG_KEY: 'phc_test',
      POSTHOG_HOST: 'https://posthog.internal.example',
    })

    expect(isIgnored(config, 'https://us.i.posthog.com/i/v1/logs')).toBe(true)
    expect(isIgnored(config, 'https://us.i.posthog.com/batch/')).toBe(true)
    expect(isIgnored(config, 'https://posthog.internal.example/i/v1/traces')).toBe(true)
    expect(isIgnored(config, 'https://api.resend.com/emails')).toBe(false)
    expect(isIgnored(config, 'https://evilposthog.com/')).toBe(false)
  })
})

describe('redactUrlQueries', () => {
  it('strips query strings and fragments from URL attributes before export', () => {
    const attributes: Record<string, unknown> = {
      'http.target': '/api/trpc/household.findBySearchPublic?input=%7B%22searchText%22%7D',
      'http.url': 'https://oswp.app/w/x?invite=secret#top',
      'url.full': 'https://oswp.app/plain',
      'url.query': 'input=secret',
      'http.method': 'GET',
    }
    redactUrlQueries().onEnd({ attributes } as never)

    expect(attributes).toEqual({
      'http.target': '/api/trpc/household.findBySearchPublic',
      'http.url': 'https://oswp.app/w/x',
      'url.full': 'https://oswp.app/plain',
      'url.query': '',
      'http.method': 'GET',
    })
  })

  it('runs before the @vercel/otel exporters', () => {
    const [first] = buildNodeOTelConfig({ POSTHOG_KEY: 'phc_test' }).spanProcessors ?? []
    expect(first).not.toBe('auto')
  })
})

describe('redaction with the real SDK pipeline', () => {
  const { BasicTracerProvider, InMemorySpanExporter, SimpleSpanProcessor } =
    require('@opentelemetry/sdk-trace-base') as typeof import('@opentelemetry/sdk-trace-base')

  const exportSpan = (name: string, attributes: Record<string, string>) => {
    const exporter = new InMemorySpanExporter()
    const provider = new BasicTracerProvider({
      spanProcessors: [redactUrlQueries(), new SimpleSpanProcessor(exporter)],
    })
    provider.getTracer('test').startSpan(name, { attributes }).end()
    const [span] = exporter.getFinishedSpans()
    if (!span) throw new Error('no span exported')
    return span
  }

  it('sanitizes URL-bearing span names, not just attributes', () => {
    const span = exportSpan('fetch GET https://example.com/document?token=REVIEW_SECRET', {
      'http.url': 'https://example.com/document?token=REVIEW_SECRET',
    })
    expect(span.name).toBe('fetch GET https://example.com/document')
    expect(span.attributes['http.url']).toBe('https://example.com/document')
  })

  it('masks secrets carried in URL paths and credentials', () => {
    const url = 'https://api.telegram.org/bot123456789:AAH-secret_Token/sendMessage'
    const span = exportSpan(`fetch POST ${url}`, {
      'http.url': url,
      'resource.name': url,
      'url.full': 'https://user:pw@api.telegram.org/file/bot123456789:AAH-secret_Token/x.jpg',
    })
    expect(span.name).toBe('fetch POST https://api.telegram.org/bot[REDACTED]/sendMessage')
    expect(span.attributes['http.url']).toBe('https://api.telegram.org/bot[REDACTED]/sendMessage')
    expect(span.attributes['resource.name']).toBe(
      'https://api.telegram.org/bot[REDACTED]/sendMessage'
    )
    expect(span.attributes['url.full']).toBe('https://api.telegram.org/file/bot[REDACTED]/x.jpg')
    expect(JSON.stringify({ name: span.name, attributes: span.attributes })).not.toContain(
      'secret_Token'
    )
  })

  it('leaves route-style span names alone', () => {
    expect(exportSpan('GET /api/trpc/[trpc]', {}).name).toBe('GET /api/trpc/[trpc]')
    expect(exportSpan('trpc guest.list', {}).name).toBe('trpc guest.list')
  })
})

describe('flushLogsPerRequest', () => {
  const VERCEL_CONTEXT = Symbol.for('@vercel/request-context')
  const globals = globalThis as unknown as Record<symbol, unknown>

  afterEach(() => {
    delete globals[VERCEL_CONTEXT]
  })

  const fakeProcessor = () =>
    ({
      onEmit: jest.fn(),
      forceFlush: jest.fn().mockResolvedValue(undefined),
      shutdown: jest.fn().mockResolvedValue(undefined),
    }) as unknown as LogRecordProcessor & { onEmit: jest.Mock; forceFlush: jest.Mock }

  it('flushes logs through waitUntil without depending on any span (sampled-out requests)', async () => {
    const waitUntil = jest.fn()
    // Like AsyncLocalStorage, get() returns the same store for the whole request.
    const store = { waitUntil }
    globals[VERCEL_CONTEXT] = { get: () => store }
    const delegate = fakeProcessor()
    const processor = flushLogsPerRequest(delegate)

    processor.onEmit({} as never)
    processor.onEmit({} as never)

    expect(delegate.onEmit).toHaveBeenCalledTimes(2)
    // One flush per burst, registered with the request's waitUntil.
    expect(waitUntil).toHaveBeenCalledTimes(1)
    await waitUntil.mock.calls[0][0]
    expect(delegate.forceFlush).toHaveBeenCalledTimes(1)

    // Logs emitted after that flush started get their own flush.
    processor.onEmit({} as never)
    expect(waitUntil).toHaveBeenCalledTimes(2)
    await waitUntil.mock.calls[1][0]
    expect(delegate.forceFlush).toHaveBeenCalledTimes(2)
  })

  it('exports a log emitted with no span at all before waitUntil settles', async () => {
    const waitUntil = jest.fn()
    // Like AsyncLocalStorage, get() returns the same store for the whole request.
    const store = { waitUntil }
    globals[VERCEL_CONTEXT] = { get: () => store }
    const exporter = new InMemoryLogRecordExporter()
    const provider = new LoggerProvider({
      processors: [
        flushLogsPerRequest(
          // A long delay proves the export comes from the per-request flush.
          new BatchLogRecordProcessor({ exporter, scheduledDelayMillis: 60_000 })
        ),
      ],
    })
    logs.setGlobalLoggerProvider(provider)

    logs.getLogger('test').emit({ body: 'sampled-out request failed' })
    expect(exporter.getFinishedLogRecords()).toHaveLength(0)

    await waitUntil.mock.calls[0][0]
    expect(exporter.getFinishedLogRecords().map((record) => record.body)).toEqual([
      'sampled-out request failed',
    ])
    await provider.shutdown()
    logs.disable()
  })

  it('relies on the batch timer outside a request context (long-lived servers)', () => {
    const delegate = fakeProcessor()
    flushLogsPerRequest(delegate).onEmit({} as never)
    expect(delegate.onEmit).toHaveBeenCalledTimes(1)
    expect(delegate.forceFlush).not.toHaveBeenCalled()
  })

  it('never lets a failed flush reject waitUntil', async () => {
    const waitUntil = jest.fn()
    // Like AsyncLocalStorage, get() returns the same store for the whole request.
    const store = { waitUntil }
    globals[VERCEL_CONTEXT] = { get: () => store }
    const delegate = fakeProcessor()
    delegate.forceFlush.mockRejectedValue(new Error('network'))

    flushLogsPerRequest(delegate).onEmit({} as never)
    await expect(waitUntil.mock.calls[0][0]).resolves.toBeUndefined()
  })
})
