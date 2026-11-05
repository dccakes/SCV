'use client'

import { AuthUIProvider } from '@daveyplate/better-auth-ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

import { ThemeProvider } from '~/components/theme-provider'
import { PostHogProvider } from '~/lib/analytics/posthog-client'
import { authClient } from '~/lib/auth-client'
import { authUiCustomOrganizationRoles } from '~/lib/organization-roles'

const EMAIL_VERIFICATION_PATH = '/auth/email-verification'

// The auth UI navigates to the OTP step without the current query string, which drops
// `redirectTo` (e.g. an organization invite to accept after sign-up). Carry it over so the
// user still lands where they were headed once verification succeeds.
function withRedirectTo(path: string): string {
  if (typeof window === 'undefined' || !path.startsWith(EMAIL_VERIFICATION_PATH)) {
    return path
  }

  const redirectTo = new URLSearchParams(window.location.search).get('redirectTo')
  if (!redirectTo) {
    return path
  }

  const url = new URL(path, window.location.origin)
  if (!url.searchParams.has('redirectTo')) {
    url.searchParams.set('redirectTo', redirectTo)
  }

  return `${url.pathname}${url.search}`
}

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
          navigate={(path) => router.push(withRedirectTo(path))}
          replace={(path) => router.replace(path)}
          onSessionChange={() => {
            router.refresh()
          }}
          Link={Link}
          emailOTP
          signUp={signupsEnabled}
          emailVerification={{ otp: true }}
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
