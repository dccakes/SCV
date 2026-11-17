/**
 * AI SDK v7 telemetry for PostHog AI observability.
 *
 * In AI SDK 7 the `ai` package emits no OpenTelemetry spans by itself: an
 * integration from `@ai-sdk/otel` is registered once at startup and then every
 * call is traced (opt-out). Spans go to the global tracer provider set up by
 * `@vercel/otel`, and `PostHogSpanProcessor` (see node-otel.ts) forwards the AI
 * ones to PostHog, which turns them into `$ai_generation` events.
 *
 * Each call passes its PostHog identity through `runtimeContext`; `enrichAiSpan`
 * maps it onto the attributes PostHog reads. Only fields listed in the call's
 * `telemetry.includeRuntimeContext` ever reach this function.
 */

import { OpenTelemetry } from '@ai-sdk/otel'
import type { Attributes } from '@opentelemetry/api'
import { registerTelemetry } from 'ai'

/** PostHog identity and properties a call attaches to its AI spans. */
export interface AiTelemetryContext {
  /** Signed-in user id. Omit for anonymous guests so no person is attached. */
  distinctId?: string
  /** Conversation id: groups every call of one chat into an AI session. */
  sessionId?: string
  /** posthog-js session id, linking the generation to its session replay. */
  browserSessionId?: string
  /** Scalar custom properties (wedding id, persona, environment). */
  properties?: Record<string, string | number | boolean | undefined>
}

/** Every field of {@link AiTelemetryContext}; runtime context is excluded unless listed. */
export const ETTA_TELEMETRY_CONTEXT = {
  distinctId: true,
  sessionId: true,
  browserSessionId: true,
  properties: true,
} as const satisfies Record<keyof AiTelemetryContext, true>

const isScalar = (value: unknown): value is string | number | boolean =>
  typeof value === 'string' ||
  typeof value === 'boolean' ||
  (typeof value === 'number' && Number.isFinite(value))

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined

type EnrichSpan = NonNullable<ConstructorParameters<typeof OpenTelemetry>[0]>['enrichSpan']

export const enrichAiSpan: NonNullable<EnrichSpan> = ({ runtimeContext }) => {
  const attributes: Attributes = {}
  if (!runtimeContext) return attributes

  const { properties } = runtimeContext
  if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
    for (const [key, value] of Object.entries(properties)) {
      if (isScalar(value)) attributes[key] = value
    }
  }

  // Identity last, so a custom property can never overwrite it.
  const distinctId = asString(runtimeContext.distinctId)
  const sessionId = asString(runtimeContext.sessionId)
  const browserSessionId = asString(runtimeContext.browserSessionId)
  if (distinctId) attributes['posthog.distinct_id'] = distinctId
  if (sessionId) attributes.$ai_session_id = sessionId
  if (browserSessionId) attributes.$session_id = browserSessionId
  return attributes
}

const REGISTERED = '__SCV_AI_TELEMETRY_REGISTERED__'

/**
 * Registers the AI SDK OpenTelemetry integration. Idempotent: `registerTelemetry`
 * appends to a global list, so a second call would duplicate every span.
 */
export function registerAiTelemetry(): void {
  const globals = globalThis as Record<string, unknown>
  if (globals[REGISTERED]) return
  globals[REGISTERED] = true
  registerTelemetry(
    new OpenTelemetry({
      // Trace names in PostHog come from the root span: `invoke_agent etta.couple`.
      agentSpanName: 'functionId',
      enrichSpan: enrichAiSpan,
    })
  )
}
