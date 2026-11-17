'use client'

import posthog from 'posthog-js'
import { type ReactNode, useEffect } from 'react'

import { useSession } from '~/lib/auth-client'

/** posthog-js persists this as 'identified' once `identify()` has run in this browser. */
const isIdentifiedInPostHog = (): boolean => posthog.get_property('$user_state') === 'identified'

function PostHogIdentitySync(): null {
  const { data: session, isPending, error } = useSession()

  useEffect(() => {
    // A failed session lookup is not a sign-out; don't drop the identity on a network blip.
    if (isPending || error || typeof window === 'undefined' || !posthog.__loaded) {
      return
    }

    const userId = session?.user?.id
    if (!userId) {
      // Read PostHog's own persisted state, not component memory: sign-out
      // reloads the page, so only a fresh mount sees the signed-out session.
      // Without this, the next person on the device inherits the old identity.
      if (isIdentifiedInPostHog()) {
        posthog.reset()
      }
      return
    }

    posthog.identify(userId, {
      email: session.user.email,
      name: session.user.name,
    })
  }, [isPending, error, session])

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
