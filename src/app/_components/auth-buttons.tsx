'use client'

import Link from 'next/link'
import { Button } from '~/components/ui/button'
import { signOut } from '~/lib/auth-client'

export function SignInButton() {
  return (
    <Button asChild size='sm'>
      <Link href='/auth/signin'>Sign In</Link>
    </Button>
  )
}

export function SignOutButton() {
  return (
    <Button variant='outline' size='sm' onClick={() => signOut()}>
      Sign Out
    </Button>
  )
}
