'use client'

import posthog from 'posthog-js'
import { type ReactNode, useEffect, useRef } from 'react'

import { useSession } from '~/lib/auth-client'

function PostHogIdentitySync(): null {
  const { data: session, isPending } = useSession()
  const lastDistinctIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (isPending || typeof window === 'undefined' || !posthog.__loaded) {
      return
    }

    const userId = session?.user?.id
    if (!userId) {
      if (lastDistinctIdRef.current) {
        posthog.reset()
        lastDistinctIdRef.current = null
      }
      return
    }

    posthog.identify(userId, {
      email: session.user.email,
      name: session.user.name,
    })
    lastDistinctIdRef.current = userId
  }, [isPending, session])

  return null
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <PostHogIdentitySync />
      {children}
    </>
  )
}
