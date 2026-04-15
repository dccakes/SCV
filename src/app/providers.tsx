'use client'

import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { ThemeProvider } from '~/components/theme-provider'
import { initPostHogClient, isPostHogClientConfigured } from '~/lib/analytics/posthog-client'
import { authClient } from '~/lib/auth-client'
import { authUiCustomOrganizationRoles } from '~/lib/organization-roles'

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter()
  const posthogEnabled = isPostHogClientConfigured()

  useEffect(() => {
    if (posthogEnabled) {
      initPostHogClient()
    }
  }, [posthogEnabled])

  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
      <PostHogProvider client={posthog}>
        <AuthUIProvider
          authClient={authClient}
          navigate={(path) => router.push(path)}
          replace={(path) => router.replace(path)}
          onSessionChange={() => {
            router.refresh()
          }}
          Link={Link}
          emailOTP
          organization={{
            customRoles: authUiCustomOrganizationRoles,
          }}
        >
          {children}
        </AuthUIProvider>
      </PostHogProvider>
    </ThemeProvider>
  )
}
