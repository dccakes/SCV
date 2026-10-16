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
 * - PostHog person/session attributes on root spans,
 * - redaction of URLs in span names and attributes before any exporter.
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
  resolveServerPostHogTarget,
  SERVICE_NAME,
} from '~/lib/observability/config'

type EnvLike = Readonly<Record<string, string | undefined>>

type WaitUntil = (promise: Promise<unknown>) => void

const REQUEST_CONTEXT_SYMBOLS = [
  Symbol.for('@vercel/request-context'), // Vercel functions (what @vercel/otel reads)
  Symbol.for('@next/request-context'), // Next.js builtin context, when a host platform provides it
]

function currentRequestContext(): { waitUntil?: WaitUntil } | undefined {
  const globals = globalThis as unknown as Record<
    symbol,
    { get?: () => { waitUntil?: WaitUntil } | undefined } | undefined
  >
  for (const symbol of REQUEST_CONTEXT_SYMBOLS) {
    const context = globals[symbol]?.get?.()
    if (context?.waitUntil) return context
  }
  return undefined
}

/**
 * Flushes logs before a serverless function freezes, independent of tracing.
 *
 * `@vercel/otel` registers its per-request `waitUntil` flush only for sampled
 * root spans and never flushes log processors, so logs from sampled-out
 * requests (or emitted outside any span) could sit in the batch buffer until
 * the instance froze.
 *
 * Every flush goes through one serialized drain shared by all requests on the
 * instance. The SDK's `forceFlush()` returns immediately when another flush is
 * already exporting, without exporting records that arrived in the meantime,
 * so overlapping per-request flushes would resolve while logs were still
 * buffered. The drain instead repeats until a pass ends with no new records,
 * and each request's `waitUntil` holds the drain promise, so no request is
 * released while one of its records is unexported. Outside a request context
 * (long-lived servers, Docker) the batch processor's timer exports as usual.
 */
export function flushLogsPerRequest(processor: LogRecordProcessor): LogRecordProcessor {
  /** Set on every emit; cleared at the start of each drain pass. */
  let unflushed = false
  let drain: Promise<void> | null = null
  /** The drain each request context was handed, so it is registered once per drain. */
  const registered = new WeakMap<object, Promise<void>>()

  const runDrain = async (): Promise<void> => {
    // Yield once so a synchronous burst of records shares one export.
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    while (unflushed) {
      unflushed = false
      try {
        await processor.forceFlush()
      } catch {
        // A failed export must not wedge the drain or reject waitUntil.
      }
    }
  }

  const flushAll = (): Promise<void> => {
    if (!drain) {
      // The loop's last check and this reset run in the same synchronous step,
      // so a record emitted after it always starts a fresh drain.
      drain = runDrain().finally(() => {
        drain = null
      })
    }
    return drain
  }

  return {
    onEmit(record, context) {
      processor.onEmit(record, context)
      unflushed = true
      const requestContext = currentRequestContext()
      if (!requestContext?.waitUntil) return
      const current = flushAll()
      if (registered.get(requestContext) === current) return
      registered.set(requestContext, current)
      requestContext.waitUntil(current)
    },
    forceFlush: () => {
      unflushed = true
      return flushAll()
    },
    shutdown: async () => {
      await drain
      await processor.shutdown()
    },
  }
}

/** Attributes that can hold a URL, a path, or a span-name-like URL string. */
const URL_ATTRIBUTES = ['http.target', 'http.url', 'url.full', 'resource.name'] as const

const URL_CREDENTIALS = /(\b[a-z][a-z0-9+.-]*:\/\/)[^/?#\s@]+@/gi
// Telegram Bot API puts the bot token in the path: /bot<id>:<secret>/ and /file/bot<id>:<secret>/
const TELEGRAM_BOT_TOKEN = /\/bot\d+:[A-Za-z0-9_-]+/g
const QUERY_OR_FRAGMENT = /[?#]\S*/g

/**
 * Removes credentials, query strings, fragments, and path-embedded secrets
 * from any text that may contain URLs: span names (`fetch GET <url>`) as well
 * as URL attributes. Non-URL text such as `GET /api/trpc/[trpc]` is unchanged.
 */
export function sanitizeTelemetryText(value: string): string {
  return value
    .replace(URL_CREDENTIALS, '$1')
    .replace(TELEGRAM_BOT_TOKEN, '/bot[REDACTED]')
    .replace(QUERY_OR_FRAGMENT, '')
}

/**
 * Sanitizes span names and URL attributes before any exporter sees the span.
 * tRPC GET requests carry procedure input (guest names, search text, invite
 * tokens) in `?input=`, `@vercel/otel` names fetch spans with the full URL,
 * and the Telegram client carries its bot token in the URL path.
 * Must run first: exporters hold a reference to the span object on `onEnd`.
 */
export function redactUrlQueries(): SpanProcessor {
  return {
    onStart: () => undefined,
    onEnd(span: ReadableSpan) {
      // ReadableSpan is read-only by type only; the SDK Span stores both as
      // plain fields, and `updateName` is a no-op once the span has ended.
      const mutable = span as unknown as { name?: unknown; attributes: Record<string, unknown> }
      if (typeof mutable.name === 'string') mutable.name = sanitizeTelemetryText(mutable.name)
      for (const key of URL_ATTRIBUTES) {
        const value = mutable.attributes[key]
        if (typeof value === 'string') mutable.attributes[key] = sanitizeTelemetryText(value)
      }
      if ('url.query' in mutable.attributes) mutable.attributes['url.query'] = ''
    },
    forceFlush: () => Promise.resolve(),
    shutdown: () => Promise.resolve(),
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function buildNodeOTelConfig(env: EnvLike = process.env): Configuration {
  const target = resolveServerPostHogTarget(env)

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
  const logProcessor = flushLogsPerRequest(
    new BatchLogRecordProcessor({
      exporter: new OTLPLogExporter({ url: posthogOtlpUrl(target.host, 'logs'), headers }),
    })
  )

  return {
    ...base,
    traceExporter: new OTLPHttpProtoTraceExporter({
      url: posthogOtlpUrl(target.host, 'traces'),
      headers,
    }),
    logRecordProcessors: [logProcessor],
  }
}
