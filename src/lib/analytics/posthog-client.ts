import posthog from 'posthog-js'

import { env } from '~/env.js'
import { isAnalyticsEventName } from '~/lib/analytics/events'
import type { AnalyticsEvent, AnalyticsIdentifyPayload } from '~/lib/analytics/types'

let initialized = false

function hasClientPostHogConfig(): boolean {
  return Boolean(env.NEXT_PUBLIC_POSTHOG_KEY && env.NEXT_PUBLIC_POSTHOG_HOST)
}

function toIsoString(value: string | Date | null | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

export function initPostHogClient(): boolean {
  if (initialized) {
    return true
  }

  if (typeof window === 'undefined' || !hasClientPostHogConfig()) {
    return false
  }

  const apiKey = env.NEXT_PUBLIC_POSTHOG_KEY
  const apiHost = env.NEXT_PUBLIC_POSTHOG_HOST
  if (!apiKey || !apiHost) {
    return false
  }

  posthog.init(apiKey, {
    api_host: apiHost,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true,
    loaded: () => {
      initialized = true
    },
  })

  initialized = true
  return true
}

export function captureClientEvent(
  event: AnalyticsEvent['event'],
  properties?: AnalyticsEvent['properties']
) {
  if (!initialized && !initPostHogClient()) {
    return
  }

  if (!isAnalyticsEventName(event)) {
    return
  }

  posthog.capture(event, properties)
}

export function identifyClientUser(payload: AnalyticsIdentifyPayload) {
  if (!initialized && !initPostHogClient()) {
    return
  }

  const createdAt = toIsoString(payload.createdAt)
  const personProperties = {
    ...(payload.email ? { email: payload.email } : {}),
    ...(payload.name ? { name: payload.name } : {}),
    ...(createdAt ? { created_at: createdAt } : {}),
    ...(payload.weddingId ? { wedding_id: payload.weddingId } : {}),
  }

  posthog.identify(payload.userId, personProperties)

  if (env.NEXT_PUBLIC_POSTHOG_GROUP_ANALYTICS_ENABLED && payload.weddingId) {
    posthog.group('wedding', payload.weddingId, { wedding_id: payload.weddingId })
  }
}

export function setPostHogSessionRecording(enabled: boolean) {
  if (!initialized && !initPostHogClient()) {
    return
  }

  posthog.set_config({ disable_session_recording: !enabled })
}

export function resetPostHogClientForTests() {
  initialized = false
}

export function isPostHogClientConfigured(): boolean {
  return hasClientPostHogConfig()
}
