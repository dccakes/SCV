'use client'

import Link from 'next/link'

import { signOut } from '~/lib/auth-client'

export function SignInButton() {
  return (
    <Link
      href="/auth/signin"
      className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
    >
      Sign In
    </Link>
  )
}

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
    >
      Sign Out
    </button>
  )
}
