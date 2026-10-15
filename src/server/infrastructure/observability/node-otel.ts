/**
 * Node.js OpenTelemetry configuration for `@vercel/otel`.
 *
 * Loaded only from `register()` when `NEXT_RUNTIME === 'nodejs'`, so the
 * Node-only Prisma instrumentation and log exporter never reach the Edge bundle.
 *
 * With a PostHog project token configured this adds, on top of `@vercel/otel`'s
 * defaults (Vercel tracing integrations, `OTEL_EXPORTER_OTLP_*` env vars):
 * - an OTLP trace exporter to PostHog distributed tracing,
 * - an OTLP log exporter to PostHog Logs, registered as the global
 *   LoggerProvider used by `~/lib/observability/logger`,
 * - Prisma spans for every query,
 * - PostHog person/session attributes on root spans.
 */

import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { BatchLogRecordProcessor, type LogRecordProcessor } from '@opentelemetry/sdk-logs'
import type { ReadableSpan, SpanProcessor } from '@opentelemetry/sdk-trace-base'
import { PrismaInstrumentation } from '@prisma/instrumentation'
import { type Configuration, OTLPHttpProtoTraceExporter } from '@vercel/otel'

import {
  POSTHOG_DISTINCT_ID_ATTRIBUTE,
  POSTHOG_DISTINCT_ID_HEADER,
  POSTHOG_SESSION_ID_ATTRIBUTE,
  POSTHOG_SESSION_ID_HEADER,
  posthogOtlpUrl,
  resolveServerOtlpTarget,
  SERVICE_NAME,
} from '~/lib/observability/config'

type EnvLike = Readonly<Record<string, string | undefined>>

/**
 * `@vercel/otel` flushes span processors through `waitUntil` when a request's
 * root span ends, but it never flushes log processors. Riding along as a span
 * processor gets logs the same per-request flush before the function freezes.
 */
export function flushLogsWithSpans(processor: LogRecordProcessor): SpanProcessor {
  return {
    onStart: () => undefined,
    onEnd: () => undefined,
    forceFlush: () => processor.forceFlush(),
    // The LoggerProvider owns the processor's lifecycle.
    shutdown: () => Promise.resolve(),
  }
}

const URL_ATTRIBUTES = ['http.target', 'http.url', 'url.full'] as const

function stripQuery(value: string): string {
  const end = value.search(/[?#]/)
  return end === -1 ? value : value.slice(0, end)
}

/**
 * Removes query strings from URL attributes before any exporter sees the span.
 * tRPC GET requests carry procedure input (guest names, search text, invite
 * tokens) in `?input=`, which Next.js records verbatim on its root span.
 * Must run first: exporters hold a reference to the span object on `onEnd`.
 */
export function redactUrlQueries(): SpanProcessor {
  return {
    onStart: () => undefined,
    onEnd(span: ReadableSpan) {
      const attributes = span.attributes as Record<string, unknown>
      for (const key of URL_ATTRIBUTES) {
        const value = attributes[key]
        if (typeof value === 'string') attributes[key] = stripQuery(value)
      }
      if ('url.query' in attributes) attributes['url.query'] = ''
    },
    forceFlush: () => Promise.resolve(),
    shutdown: () => Promise.resolve(),
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function buildNodeOTelConfig(env: EnvLike = process.env): Configuration {
  const target = resolveServerOtlpTarget(env)

  const base: Configuration = {
    serviceName: SERVICE_NAME,
    attributes: {
      'service.namespace': 'oswp',
      ...(env.VERCEL_GIT_COMMIT_SHA ? { 'service.version': env.VERCEL_GIT_COMMIT_SHA } : {}),
    },
    // Joins server traces to the PostHog person and session replay that made
    // the request (headers come from posthog-js `tracing_headers`).
    attributesFromHeaders: {
      [POSTHOG_DISTINCT_ID_ATTRIBUTE]: POSTHOG_DISTINCT_ID_HEADER,
      [POSTHOG_SESSION_ID_ATTRIBUTE]: POSTHOG_SESSION_ID_HEADER,
    },
    instrumentations: ['auto', new PrismaInstrumentation()],
    spanProcessors: [redactUrlQueries(), 'auto'],
    instrumentationConfig: {
      fetch: {
        // Telemetry uploads and posthog-node calls would otherwise trace themselves.
        ignoreUrls: [
          /^https:\/\/[a-z0-9.-]*\.posthog\.com(?:[/?#]|$)/,
          ...(target ? [new RegExp(`^${escapeRegExp(new URL(target.host).origin)}`)] : []),
        ],
      },
    },
  }

  if (!target) return base

  const headers = { Authorization: `Bearer ${target.token}` }
  const logProcessor = new BatchLogRecordProcessor({
    exporter: new OTLPLogExporter({ url: posthogOtlpUrl(target.host, 'logs'), headers }),
  })

  return {
    ...base,
    traceExporter: new OTLPHttpProtoTraceExporter({
      url: posthogOtlpUrl(target.host, 'traces'),
      headers,
    }),
    spanProcessors: [redactUrlQueries(), 'auto', flushLogsWithSpans(logProcessor)],
    logRecordProcessors: [logProcessor],
  }
}
