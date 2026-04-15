'use client'

import { useEffect } from 'react'

import { setPostHogSessionRecording } from '~/lib/analytics/posthog-client'

type PostHogSessionRecordingProps = {
  enabled: boolean
}

export function PostHogSessionRecording({ enabled }: Readonly<PostHogSessionRecordingProps>) {
  useEffect(() => {
    setPostHogSessionRecording(enabled)

    return () => {
      setPostHogSessionRecording(false)
    }
  }, [enabled])

  return null
}
