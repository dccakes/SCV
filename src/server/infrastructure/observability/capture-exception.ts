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
  /** Authenticated user id. The only identity allowed to update a person profile. */
  userId?: string | null
  /**
   * Distinct id sent by the browser (`X-POSTHOG-DISTINCT-ID`). Client-controlled,
   * so it only links the event to a session; it never updates a person profile.
   */
  clientDistinctId?: string
  sessionId?: string
  properties?: Readonly<Record<string, unknown>>
}

export async function captureServerException(
  error: unknown,
  { userId, clientDistinctId, sessionId, properties }: ServerExceptionContext = {}
): Promise<void> {
  try {
    const client = getPostHogServer()
    if (!client) return
    const spanContext = trace.getActiveSpan()?.spanContext()
    const distinctId = userId || clientDistinctId || undefined
    client.captureException(error, distinctId, {
      ...(spanContext ? { trace_id: spanContext.traceId, span_id: spanContext.spanId } : {}),
      // Explicit ids win: callers deferring capture (e.g. via `after()`) pass
      // the ids captured while the failing span was still active.
      ...properties,
      ...(sessionId ? { $session_id: sessionId } : {}),
      // Only a verified user may create or update a person profile; anonymous
      // guests and spoofable header ids stay profile-less (as in captureServerEvent).
      $process_person_profile: Boolean(userId),
    })
    // Serverless functions can freeze right after the response; send now.
    await client.flush()
  } catch {
    // Swallow: reporting must never break the request path.
  }
}
