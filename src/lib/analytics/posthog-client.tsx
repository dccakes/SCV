'use client'

/**
 * Client-side PostHog provider
 *
 * Initializes `posthog-js` once (browser only) and wires manual pageview capture
 * for the Next.js App Router. Mounted once at the root layout so it covers both
 * the authenticated product and the public wedding website templates.
 *
 * When `NEXT_PUBLIC_POSTHOG_KEY` is absent the provider is a transparent
 * pass-through — nothing is loaded or captured — so local/dev builds without a
 * key behave exactly as before.
 *
 * Design notes:
 * - `person_profiles: 'identified_only'` — guests are anonymous by design, so we
 *   don't create person profiles for them.
 * - `autocapture: false` — we rely on a small, standardized set of explicit
 *   events (plus the backend instrumentation) rather than noisy DOM autocapture.
 * - Rendering never affects layout: PostHog injects no visible DOM.
 */

import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider as PostHogJsProvider } from 'posthog-js/react'
import { type ReactNode, Suspense, useEffect } from 'react'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

let didInit = false

function ensureInitialized(): boolean {
  if (typeof window === 'undefined' || !POSTHOG_KEY) {
    return false
  }
  if (!didInit) {
    didInit = true
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false, // captured manually below for the App Router
      capture_pageleave: true,
      autocapture: false,
    })
  }
  return true
}

/**
 * Captures a `$pageview` on every App Router navigation (path or query change).
 * Wrapped in Suspense by the provider because `useSearchParams` requires it.
 */
function PageviewTracker(): null {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!POSTHOG_KEY || typeof window === 'undefined') {
      return
    }
    const search = searchParams?.toString()
    const url = search
      ? `${window.location.origin}${pathname}?${search}`
      : `${window.location.origin}${pathname}`
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams])

  return null
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    ensureInitialized()
  }, [])

  if (!POSTHOG_KEY) {
    return <>{children}</>
  }

  return (
    <PostHogJsProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </PostHogJsProvider>
  )
}
