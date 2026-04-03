// better-auth 1.5.6: OrganizationPlugin / StrictEndpoint no longer structurally satisfies
// BetterAuthClientPlugin due to a Zod 4 migration type regression. The cast is safe —
// plugins satisfy the interface at runtime. Track: https://github.com/better-auth/better-auth/issues/5637
import type { BetterAuthClientPlugin } from 'better-auth'
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

export const authClientPlugins: BetterAuthClientPlugin[] = [
  organizationClient({
    ac,
    roles: authClientOrganizationRoles,
  }) as unknown as BetterAuthClientPlugin,
]

export const authClient = createAuthClient({
  baseURL: resolveAuthClientBaseUrl(
    typeof window !== 'undefined' ? window.location.origin : undefined
  ),
  plugins: [...authClientPlugins, emailOTPClient() as unknown as BetterAuthClientPlugin],
})

export const { signIn, signOut, signUp, useSession } = authClient
