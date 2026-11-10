import { emailOTPClient, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import { env } from '~/env'
import { ac, organizationRoles } from '~/lib/auth-permissions'

export const authClientOrganizationRoles = organizationRoles

export function resolveAuthClientBaseUrl(windowLocationOrigin?: string): string {
  if (windowLocationOrigin) {
    return windowLocationOrigin
  }

  return env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

export const authClientPlugins = [
  organizationClient({
    ac,
    roles: authClientOrganizationRoles,
  }),
]

export const authClient = createAuthClient({
  baseURL: resolveAuthClientBaseUrl(
    typeof window !== 'undefined' ? window.location.origin : undefined
  ),
  plugins: [...authClientPlugins, emailOTPClient()],
})

export const { signIn, signOut, signUp, useSession } = authClient
