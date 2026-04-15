'use client'

import { useEffect, useRef } from 'react'

import { identifyClientUser } from '~/lib/analytics/posthog-client'

type PostHogAuthIdentityProps = {
  userId: string
  weddingId?: string | null
  email?: string | null
  name?: string | null
  createdAt?: string | Date | null
}

export function PostHogAuthIdentity(props: Readonly<PostHogAuthIdentityProps>) {
  const previousKey = useRef<string | null>(null)
  const { userId, weddingId, email, name, createdAt } = props

  useEffect(() => {
    const identityKey = JSON.stringify([
      userId,
      weddingId ?? null,
      email ?? null,
      name ?? null,
      createdAt ? String(createdAt) : null,
    ])

    if (previousKey.current === identityKey) {
      return
    }

    identifyClientUser({ userId, weddingId, email, name, createdAt })
    previousKey.current = identityKey
  }, [createdAt, email, name, userId, weddingId])

  return null
}
