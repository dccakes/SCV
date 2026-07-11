/**
 * Server-side event capture
 *
 * Thin, resilient wrapper over the PostHog node client. Every backend analytics
 * event flows through {@link captureServerEvent}, which guarantees:
 *
 * - the `wedding_id` (and other identifying context) is attached consistently,
 * - `$process_person_profile: false` so anonymous guests don't create person
 *   profiles (guests are anonymous by design), and
 * - failures never propagate — analytics must not break a real request.
 */

import 'server-only'

import type { ResolvedAnalyticsContext } from '~/server/infrastructure/analytics/analytics-context'
import { getPostHogServer } from '~/server/infrastructure/analytics/posthog-server'

export interface CaptureServerEventParams {
  /** Canonical event name, e.g. `guest_list.household.added`. */
  event: string
  /** Resolved identifying context (distinctId, weddingId, token, household…). */
  context: ResolvedAnalyticsContext
  /** Additional event properties (e.g. the mutation payload). */
  properties?: Record<string, unknown>
}

/**
 * Build the flat property bag sent to PostHog from the resolved context and any
 * extra properties. Identifying context is namespaced with stable snake_case
 * keys so events are easy to group and filter.
 */
export function buildEventProperties({
  context,
  properties,
}: Pick<CaptureServerEventParams, 'context' | 'properties'>): Record<string, unknown> {
  return {
    // Identifying context — always present when known.
    wedding_id: context.weddingId ?? null,
    guest_token: context.token ?? null,
    household_id: context.householdId ?? null,
    website_sub_url: context.subUrl ?? null,
    is_authenticated: context.isAuthenticated,
    source: 'backend',
    // Don't create person profiles for anonymous guests.
    $process_person_profile: context.isAuthenticated,
    ...properties,
  }
}

/**
 * Capture a server-side analytics event. Never throws.
 */
export function captureServerEvent({ event, context, properties }: CaptureServerEventParams): void {
  try {
    const client = getPostHogServer()
    if (!client) {
      return
    }

    client.capture({
      distinctId: context.distinctId,
      event,
      properties: buildEventProperties({ context, properties }),
    })
  } catch {
    // Swallow — analytics must never break the request path.
  }
}
