import { getSessionCookie } from 'better-auth/cookies'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { reservedWebsiteRootSegmentsSet } from '~/lib/website/reserved-root-segments'

const PUBLIC_PREFIXES = ['/auth', '/api/auth', '/join', '/blog', '/api/webhooks', '/api/cron']
const PUBLIC_EXACT_PATHS = ['/', '/api/blob/upload', '/pricing', '/open-source']

const isReservedSlug = (slug: string): boolean =>
  reservedWebsiteRootSegmentsSet.has(slug) || slug.startsWith('auth') || slug.startsWith('join')

const isPublicWebsitePath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length < 2) return false
  if (segments[0] !== 'w') return false
  if (segments.length > 3 || (segments.length === 3 && segments[2] !== 'rsvp')) return false
  const slug = segments[1]
  return !!slug && !isReservedSlug(slug)
}

const isPublicPath = (pathname: string): boolean =>
  PUBLIC_EXACT_PATHS.includes(pathname) ||
  PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
  isPublicWebsitePath(pathname)

const getLegacyWebsiteRedirect = (req: NextRequest): URL | null => {
  const segments = req.nextUrl.pathname.split('/').filter(Boolean)
  if (segments.length !== 1) return null
  const [slug] = segments
  if (!slug || isReservedSlug(slug)) return null
  return new URL(`/w/${slug}${req.nextUrl.search}`, req.url)
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const legacyWebsiteRedirect = getLegacyWebsiteRedirect(req)
  if (legacyWebsiteRedirect) {
    return NextResponse.redirect(legacyWebsiteRedirect, 302)
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
