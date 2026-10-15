/**
 * Server-side exception capture for PostHog error tracking.
 *
 * Errors are linked to the active trace (`trace_id`/`span_id`) and, when the
 * browser sent posthog-js tracing headers, to the person and session replay.
 * Never throws: error reporting must not mask the original failure.
 */

import { trace } from '@opentelemetry/api'

import { getPostHogServer } from '~/server/infrastructure/analytics/posthog-server'

export interface ServerExceptionContext {
  distinctId?: string
  sessionId?: string
  properties?: Readonly<Record<string, unknown>>
}

export async function captureServerException(
  error: unknown,
  { distinctId, sessionId, properties }: ServerExceptionContext = {}
): Promise<void> {
  try {
    const client = getPostHogServer()
    if (!client) return
    const spanContext = trace.getActiveSpan()?.spanContext()
    client.captureException(error, distinctId, {
      ...(spanContext ? { trace_id: spanContext.traceId, span_id: spanContext.spanId } : {}),
      // Explicit ids win: callers deferring capture (e.g. via `after()`) pass
      // the ids captured while the failing span was still active.
      ...properties,
      ...(sessionId ? { $session_id: sessionId } : {}),
      // Anonymous guests stay anonymous, matching captureServerEvent.
      $process_person_profile: Boolean(distinctId),
    })
    // Serverless functions can freeze right after the response; send now.
    await client.flush()
  } catch {
    // Swallow: reporting must never break the request path.
  }
}
