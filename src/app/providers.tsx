'use client'

import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode } from 'react'

import { authClient } from '~/lib/auth-client'

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <AuthUIProvider
      authClient={authClient}
      navigate={(path) => router.push(path)}
      replace={(path) => router.replace(path)}
      onSessionChange={() => {
        router.refresh()
      }}
      Link={Link}
    >
      {children}
    </AuthUIProvider>
  )
}
