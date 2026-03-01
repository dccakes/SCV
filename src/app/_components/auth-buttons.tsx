'use client'

import Link from 'next/link'

import { signOut } from '~/lib/auth-client'
import { Button } from '~/components/ui/button'

export function SignInButton() {
  return (
    <Button asChild size="sm">
      <Link href="/auth/signin">Sign In</Link>
    </Button>
  )
}

export function SignOutButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => signOut()}>
      Sign Out
    </Button>
  )
}
