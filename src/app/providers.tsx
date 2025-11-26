'use client'

import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ReactNode } from 'react'

import { ThemeProvider } from '~/app/_components/theme-provider'
import { authClient } from '~/lib/auth-client'

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
    </ThemeProvider>
  )
}
