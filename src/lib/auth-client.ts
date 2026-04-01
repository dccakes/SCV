import { emailOTPClient, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import { env } from '~/env'
import { ac, organizationRoles } from '~/lib/auth-permissions'

export const authClientOrganizationRoles = organizationRoles

export const authClientPlugins = [
  organizationClient({
    ac,
    roles: authClientOrganizationRoles,
  }),
]

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  plugins: [...authClientPlugins, emailOTPClient()],
})

export const { signIn, signOut, signUp, useSession } = authClient
