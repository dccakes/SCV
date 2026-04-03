import { getSessionCookie } from 'better-auth/cookies'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/guest-list',
  '/events',
  '/vendors',
  '/settings',
  '/old_dashboard',
]

const isProtectedPath = (pathname: string): boolean =>
  PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  if (!isProtectedPath(pathname)) {
    return NextResponse.next()
  }

  // Check for session token using Better Auth's utility (handles cookie prefixes)
  const sessionToken = getSessionCookie(req)

  // Redirect to sign in for unauthenticated access to protected routes
  if (!sessionToken) {
    const redirectUrl = new URL('/signin', req.url)
    redirectUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
