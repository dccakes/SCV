/**
 * PostHog server client (singleton)
 *
 * Provides a lazily-instantiated `posthog-node` client. When no PostHog key is
 * configured the client is `null` and every call site becomes a no-op, so the
 * application runs identically with or without analytics wired up.
 */

import 'server-only'

import { PostHog } from 'posthog-node'

const DEFAULT_HOST = 'https://us.i.posthog.com'

/*
 * NOTE: we intentionally read `process.env` directly here rather than importing
 * the (ESM-heavy) `~/env` module. This keeps the analytics client — which is
 * loaded transitively by every tRPC router via the middleware — free of a
 * dependency that would otherwise need mocking in every router unit test. The
 * variables are still declared and validated in `src/env.js`.
 */

let client: PostHog | null = null
let initialized = false

/**
 * Resolve the server analytics key. Prefer a dedicated server key, otherwise
 * reuse the public project key (same PostHog project).
 */
function resolveKey(): string | undefined {
  return process.env.POSTHOG_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY ?? undefined
}

function resolveHost(): string {
  return process.env.POSTHOG_HOST ?? process.env.NEXT_PUBLIC_POSTHOG_HOST ?? DEFAULT_HOST
}

/**
 * Get the shared PostHog server client, or `null` when analytics is disabled.
 */
export function getPostHogServer(): PostHog | null {
  if (initialized) {
    return client
  }
  initialized = true

  const key = resolveKey()
  if (!key) {
    client = null
    return client
  }

  client = new PostHog(key, {
    host: resolveHost(),
    // Flush eagerly: serverless invocations are short-lived, so we don't want
    // events queued in memory that never get sent.
    flushAt: 1,
    flushInterval: 0,
  })
  return client
}

/**
 * Flush and shut down the client (useful for graceful shutdown / tests).
 */
export async function shutdownPostHogServer(): Promise<void> {
  if (client) {
    await client.shutdown()
    client = null
    initialized = false
  }
}
