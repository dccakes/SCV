/**
 * Shared OpenTelemetry / PostHog observability settings.
 *
 * PostHog ingests standard OTLP over HTTP for traces and logs, authenticated
 * with the public project token (`phc_…`). Isomorphic: imported by the
 * server instrumentation hook and by the browser bundle.
 */

export const SERVICE_NAME = 'scv'
export const BROWSER_SERVICE_NAME = 'scv-browser'

/**
 * Same-origin PostHog reverse proxy. Used by posthog-js (`api_host`), the browser
 * trace exporter, and the auth bypass in `src/proxy.ts`. next.config.js can't
 * import TypeScript, so its rewrites repeat the value; a unit test keeps them in sync.
 */
export const POSTHOG_PROXY_PATH = '/oswp-pHsc1'

/** PostHog US ingestion host. Keep in sync with the rewrites in next.config.js. */
export const POSTHOG_INGEST_HOST = 'https://us.i.posthog.com'

/**
 * Span attributes PostHog uses to join spans to a person and session replay.
 * See https://posthog.com/docs/distributed-tracing/installation/nodejs
 */
export const POSTHOG_DISTINCT_ID_ATTRIBUTE = 'posthogDistinctId'
export const POSTHOG_SESSION_ID_ATTRIBUTE = 'sessionId'

/** Headers posthog-js adds to same-origin requests via `tracing_headers`. */
export const POSTHOG_DISTINCT_ID_HEADER = 'x-posthog-distinct-id'
export const POSTHOG_SESSION_ID_HEADER = 'x-posthog-session-id'

export type OtlpSignal = 'traces' | 'logs'

export function posthogOtlpUrl(host: string, signal: OtlpSignal): string {
  return `${host.replace(/\/+$/, '')}/i/v1/${signal}`
}

export interface ServerPostHogTarget {
  token: string
  host: string
}

type EnvLike = Readonly<Record<string, string | undefined>>

const nonBlank = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * The single source of truth for server-side PostHog: posthog-node (events,
 * exceptions), OTLP traces, and OTLP logs all use this token and host, so they
 * can never land on different hosts. `NEXT_PUBLIC_POSTHOG_HOST` is deliberately
 * ignored: it is the UI host (`ui_host`), not an ingestion host.
 */
export function resolveServerPostHogTarget(env: EnvLike = process.env): ServerPostHogTarget | null {
  const token = nonBlank(env.POSTHOG_KEY) ?? nonBlank(env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN)
  if (!token) return null
  return { token, host: nonBlank(env.POSTHOG_HOST) ?? POSTHOG_INGEST_HOST }
}

/** Parse a 0..1 sample rate, falling back to `fallback` for anything invalid. */
export function parseSampleRate(value: string | undefined, fallback = 1): number {
  if (value === undefined || value.trim() === '') return fallback
  const rate = Number(value)
  return Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : fallback
}
