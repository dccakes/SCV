import { getSessionCookie } from 'better-auth/cookies'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const PUBLIC_PREFIXES = ['/auth', '/api/auth', '/join']
const PUBLIC_EXACT_PATHS = ['/', '/api/blob/upload']
const RESERVED_ROOT_SEGMENTS = new Set([
  '',
  'api',
  'auth',
  'dashboard',
  'design-system',
  'events',
  'guest-list',
  'join',
  'old_dashboard',
  'settings',
  'vendors',
])

const isPublicWebsitePath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) {
    return false
  }
  if (segments.length > 2 || (segments.length === 2 && segments[1] !== 'rsvp')) {
    return false
  }

  const [rootSegment] = segments
  if (!rootSegment) {
    return false
  }

  if (
    RESERVED_ROOT_SEGMENTS.has(rootSegment) ||
    rootSegment.startsWith('auth') ||
    rootSegment.startsWith('join')
  ) {
    return false
  }

  return true
}

const isPublicPath = (pathname: string): boolean =>
  PUBLIC_EXACT_PATHS.includes(pathname) ||
  PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
  isPublicWebsitePath(pathname)

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Check for session token using Better Auth's utility (handles cookie prefixes)
  const sessionToken = getSessionCookie(req)

  // Redirect to sign in for unauthenticated access to protected routes
  if (!sessionToken) {
    const redirectUrl = new URL('/auth/sign-in', req.url)
    redirectUrl.searchParams.set('callbackUrl', `${pathname}${req.nextUrl.search}`)
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
