'use client'

import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

import { ThemeProvider } from '~/components/theme-provider'
import { PostHogProvider } from '~/lib/analytics/posthog-client'
import { authClient } from '~/lib/auth-client'
import { authUiCustomOrganizationRoles } from '~/lib/organization-roles'

export function Providers({
  children,
  signupsEnabled = true,
}: {
  children: ReactNode
  /** Server-resolved ALLOW_SIGNUPS flag; hides sign-up UI when false. */
  signupsEnabled?: boolean
}) {
  const router = useRouter()

  return (
    <PostHogProvider>
      <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
        <AuthUIProvider
          authClient={authClient}
          navigate={(path) => router.push(path)}
          replace={(path) => router.replace(path)}
          onSessionChange={() => {
            router.refresh()
          }}
          Link={Link}
          emailOTP
          signUp={signupsEnabled}
          organization={{
            customRoles: authUiCustomOrganizationRoles,
          }}
        >
          {children}
        </AuthUIProvider>
      </ThemeProvider>
    </PostHogProvider>
  )
}
