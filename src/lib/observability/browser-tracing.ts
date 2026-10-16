/**
 * Browser OpenTelemetry tracing.
 *
 * - Document load spans join the server render trace through the
 *   `<meta name="traceparent">` tag Next.js emits (`clientTraceMetadata`).
 * - Fetch spans (tRPC, route handlers) inject W3C `traceparent` into
 *   same-origin requests, so the server spans become their children.
 * - Spans carry the PostHog distinct/session ids so a trace links back to the
 *   person and session replay.
 * - HTTP 5xx responses and network failures are reported to PostHog error
 *   tracking with the trace id, independent of trace sampling.
 *
 * Spans export as OTLP/JSON through the same-origin PostHog reverse proxy, so
 * ad blockers and CSP `connect-src 'self'` don't drop them.
 */

import { type Attributes, isSpanContextValid, type Span, SpanStatusCode } from '@opentelemetry/api'
import { W3CTraceContextPropagator } from '@opentelemetry/core'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { resourceFromAttributes } from '@opentelemetry/resources'
import {
  BatchSpanProcessor,
  ParentBasedSampler,
  type SpanProcessor,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import posthog from 'posthog-js'

import {
  BROWSER_SERVICE_NAME,
  POSTHOG_DISTINCT_ID_ATTRIBUTE,
  POSTHOG_PROXY_PATH,
  POSTHOG_SESSION_ID_ATTRIBUTE,
} from '~/lib/observability/config'

export interface BrowserTracingOptions {
  token: string
  sampleRate: number
  environment: string
  version: string
}

const URL_ATTRIBUTES = ['http.url', 'url.full'] as const
const POSTHOG_PROXY_PATTERN = new RegExp(`${POSTHOG_PROXY_PATH}(?:[/?#]|$)`)

let initialized = false

/** Strip query strings, fragments, and credentials: invite tokens and tRPC inputs live there. */
export function redactUrl(value: string, base: string): string {
  const url = new URL(value, base)
  url.search = ''
  url.hash = ''
  url.username = ''
  url.password = ''
  return url.href
}

export function redactSpanUrls(span: Span): void {
  // Non-recording (sampled-out) spans have no attributes but still propagate.
  const attributes = (span as unknown as { attributes?: Attributes }).attributes
  if (!attributes) return
  for (const key of URL_ATTRIBUTES) {
    const value = attributes[key]
    if (typeof value === 'string') span.setAttribute(key, redactUrl(value, window.location.href))
  }
}

/** The error to report for a finished fetch, or `undefined` when it succeeded or was aborted. */
export function fetchFailure(
  result: Response | { status?: number; message?: string; name?: string }
) {
  if (result instanceof Error) {
    return result.name === 'AbortError' ? undefined : result
  }
  if (typeof result.status === 'number' && result.status >= 500) {
    return new Error(`HTTP request failed with status ${result.status}`)
  }
  return undefined
}

function posthogCorrelationProcessor(): SpanProcessor {
  return {
    onStart(span) {
      if (!posthog.__loaded) return
      const distinctId = posthog.get_distinct_id()
      const sessionId = posthog.get_session_id()
      if (distinctId) span.setAttribute(POSTHOG_DISTINCT_ID_ATTRIBUTE, distinctId)
      if (sessionId) span.setAttribute(POSTHOG_SESSION_ID_ATTRIBUTE, sessionId)
    },
    onEnd: () => undefined,
    forceFlush: () => Promise.resolve(),
    shutdown: () => Promise.resolve(),
  }
}

function reportFetchFailure(
  span: Span,
  request: Request | RequestInit,
  result: Response | { status?: number; message?: string; name?: string }
): void {
  redactSpanUrls(span)
  const error = fetchFailure(result)
  if (!error) return
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
  if (!posthog.__loaded) return
  const spanContext = span.spanContext()
  // Recording spans hold the (already redacted) URL even for `fetch(string)`
  // calls; sampled-out spans only have it when a Request object was passed.
  const attributes = (span as unknown as { attributes?: Attributes }).attributes
  const spanUrl = attributes?.['url.full'] ?? attributes?.['http.url']
  const url =
    typeof spanUrl === 'string' ? spanUrl : request instanceof Request ? request.url : undefined
  posthog.captureException(error, {
    mechanism: 'fetch',
    http_status: 'status' in result ? result.status : undefined,
    ...(url ? { url: redactUrl(url, window.location.href) } : {}),
    ...(isSpanContextValid(spanContext)
      ? { trace_id: spanContext.traceId, span_id: spanContext.spanId }
      : {}),
  })
}

export function initBrowserTracing({
  token,
  sampleRate,
  environment,
  version,
}: BrowserTracingOptions): void {
  if (typeof window === 'undefined' || initialized) return
  initialized = true

  const exporterUrl = new URL(`${POSTHOG_PROXY_PATH}/i/v1/traces`, window.location.origin)
  // The project token is public by design (posthog-js ships it to every browser).
  exporterUrl.searchParams.set('token', token)

  const provider = new WebTracerProvider({
    resource: resourceFromAttributes({
      'service.name': BROWSER_SERVICE_NAME,
      'service.namespace': 'oswp',
      'service.version': version,
      'deployment.environment.name': environment,
    }),
    sampler: new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(sampleRate) }),
    spanProcessors: [
      posthogCorrelationProcessor(),
      new BatchSpanProcessor(new OTLPTraceExporter({ url: exporterUrl.href }), {
        scheduledDelayMillis: 2000,
        maxExportBatchSize: 64,
        maxQueueSize: 1024,
      }),
    ],
  })
  provider.register({ propagator: new W3CTraceContextPropagator() })

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new FetchInstrumentation({
        ignoreUrls: [POSTHOG_PROXY_PATTERN],
        ignoreNetworkEvents: true,
        applyCustomAttributesOnSpan: reportFetchFailure,
      }),
      new DocumentLoadInstrumentation({
        ignoreNetworkEvents: true,
        applyCustomAttributesOnSpan: {
          documentLoad: redactSpanUrls,
          documentFetch: redactSpanUrls,
          resourceFetch: redactSpanUrls,
        },
      }),
    ],
  })

  const flush = () => {
    provider.forceFlush().catch(() => undefined)
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
  window.addEventListener('pagehide', flush)
}
