/**
 * @jest-environment node
 */
jest.mock('@vercel/otel', () => ({
  OTLPHttpProtoTraceExporter: jest.fn().mockImplementation((config: unknown) => ({ config })),
}))

import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { BatchLogRecordProcessor, type LogRecordProcessor } from '@opentelemetry/sdk-logs'
import type { SpanProcessor } from '@opentelemetry/sdk-trace-base'
import { PrismaInstrumentation } from '@prisma/instrumentation'
import { OTLPHttpProtoTraceExporter } from '@vercel/otel'

import {
  buildNodeOTelConfig,
  flushLogsWithSpans,
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
    expect(config.spanProcessors?.[1]).toBe('auto')
    expect(config.spanProcessors).toHaveLength(3)
    expect(config.logRecordProcessors).toHaveLength(1)
    expect(config.logRecordProcessors?.[0]).toBeInstanceOf(BatchLogRecordProcessor)
    const exporter = (config.logRecordProcessors?.[0] as unknown as { _exporter: OTLPLogExporter })
      ._exporter
    expect(exporter).toBeInstanceOf(OTLPLogExporter)
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

describe('flushLogsWithSpans', () => {
  it('flushes logs whenever @vercel/otel flushes spans, without owning shutdown', async () => {
    const logProcessor = {
      forceFlush: jest.fn().mockResolvedValue(undefined),
      shutdown: jest.fn().mockResolvedValue(undefined),
      onEmit: jest.fn(),
    } as unknown as LogRecordProcessor
    const spanProcessor: SpanProcessor = flushLogsWithSpans(logProcessor)

    await spanProcessor.forceFlush()
    await spanProcessor.shutdown()

    expect(logProcessor.forceFlush).toHaveBeenCalledTimes(1)
    expect(logProcessor.shutdown).not.toHaveBeenCalled()
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
