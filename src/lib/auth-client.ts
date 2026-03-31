import { emailOTPClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import { env } from '~/env'

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  plugins: [emailOTPClient()],
})

export const { signIn, signOut, signUp, useSession } = authClient
