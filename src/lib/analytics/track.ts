/**
 * Client-side analytics `track` helper
 *
 * A thin, safe wrapper over `posthog.capture` that:
 * - attaches standardized identifying context (wedding id, guest token,
 *   household, website slug) using the same keys as the backend, and
 * - is a no-op when PostHog isn't loaded (no key configured / SSR),
 *
 * so template and product code can call `track('rsvp.public_submission.started',
 * …)` without worrying about analytics being disabled.
 */

import posthog from 'posthog-js'

/** Identifying context available on the client (all optional / best-effort). */
export interface ClientAnalyticsContext {
  weddingId?: string | null
  token?: string | null
  householdId?: string | null
  subUrl?: string | null
}

/**
 * Build the flat property bag for a client event, mapping camelCase context to
 * the stable snake_case keys shared with the backend. Undefined identifiers are
 * omitted (the client can't always know them, and null noise is unhelpful).
 */
export function buildClientEventProperties(
  context: ClientAnalyticsContext = {},
  properties: Record<string, unknown> = {}
): Record<string, unknown> {
  const out: Record<string, unknown> = { source: 'frontend' }

  if (context.weddingId) out.wedding_id = context.weddingId
  if (context.token) out.guest_token = context.token
  if (context.householdId) out.household_id = context.householdId
  if (context.subUrl) out.website_sub_url = context.subUrl

  return { ...out, ...properties }
}

/**
 * Capture a standardized client analytics event. Never throws.
 */
export function track(
  event: string,
  context: ClientAnalyticsContext = {},
  properties: Record<string, unknown> = {}
): void {
  try {
    if (typeof window === 'undefined' || !posthog.__loaded) {
      return
    }
    posthog.capture(event, buildClientEventProperties(context, properties))
  } catch {
    // Analytics must never break the UI.
  }
}
