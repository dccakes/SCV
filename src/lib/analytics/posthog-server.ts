import { PostHog } from 'posthog-node'

import { env } from '~/env.js'
import { isAnalyticsEventName } from '~/lib/analytics/events'
import type { AnalyticsServerCapturePayload } from '~/lib/analytics/types'

let singleton: PostHog | null = null

function hasServerPostHogConfig(): boolean {
  return Boolean(env.POSTHOG_API_KEY && env.NEXT_PUBLIC_POSTHOG_HOST)
}

export function getPostHogServerClient(): PostHog | null {
  if (singleton) {
    return singleton
  }

  if (!hasServerPostHogConfig()) {
    return null
  }

  const apiKey = env.POSTHOG_API_KEY
  const host = env.NEXT_PUBLIC_POSTHOG_HOST
  if (!apiKey || !host) {
    return null
  }

  singleton = new PostHog(apiKey, {
    host,
    flushAt: 1,
    flushInterval: 0,
  })

  return singleton
}

export async function captureServerEvent(payload: AnalyticsServerCapturePayload) {
  if (!isAnalyticsEventName(payload.event)) {
    return
  }

  const client = getPostHogServerClient()
  if (!client) {
    return
  }

  try {
    await client.capture(payload)
  } catch (error) {
    process.stderr.write(`[analytics] posthog server capture failed: ${String(error)}\n`)
  }
}

export async function resetPostHogServerClientForTests() {
  if (singleton) {
    await singleton.shutdown()
  }
  singleton = null
}
