import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  // Use the current origin in the browser so preview deployments don't
  // send auth requests cross-origin to the production URL (CORS).
  // Fall back to the env var only during SSR where window is unavailable.
  baseURL:
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
})

export const { signIn, signOut, signUp, useSession } = authClient
