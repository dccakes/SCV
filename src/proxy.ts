import { getSessionCookie } from 'better-auth/cookies'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getLocaleFromCountry, type Locale } from '~/lib/locale/locale-detection'

const PUBLIC_PREFIXES = ['/auth', '/api/auth', '/join', '/blog', '/api/webhooks', '/api/cron']

// Guest-facing tRPC procedures that must be reachable without a session. The
// wedding-website RSVP flow calls these from the browser; gating them would
// redirect the request to the sign-in HTML page, which the tRPC client can't
// parse as JSON. Everything else under /api/trpc stays behind the session gate,
// and each procedure still enforces its own authorization server-side.
const PUBLIC_TRPC_PROCEDURES = new Set([
  'household.findBySearchPublic',
  'website.submitPublicRsvpForm',
])

const TRPC_PREFIX = '/api/trpc/'

// The tRPC client batches calls, so the path may carry several comma-separated
// procedure names (e.g. /api/trpc/a,b). Allow the request through only when
// every batched procedure is public.
const isPublicTrpcPath = (pathname: string): boolean => {
  if (!pathname.startsWith(TRPC_PREFIX)) return false
  const procedures = pathname.slice(TRPC_PREFIX.length).split(',').filter(Boolean)
  return (
    procedures.length > 0 && procedures.every((procedure) => PUBLIC_TRPC_PROCEDURES.has(procedure))
  )
}
const PUBLIC_EXACT_PATHS = ['/', '/api/blob/upload', '/api/locale', '/pricing', '/open-source']
const RESERVED_ROOT_SEGMENTS = new Set([
  '',
  'api',
  'auth',
  'budget',
  'checklist',
  'dashboard',
  'design-system',
  'events',
  'guest-list',
  'join',
  'old_dashboard',
  'settings',
  'vendors',
  'w',
  'website',
])

const isReservedSlug = (slug: string): boolean =>
  RESERVED_ROOT_SEGMENTS.has(slug) || slug.startsWith('auth') || slug.startsWith('join')

const isPublicWebsitePath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)

  // /w/[slug] (wedding website viewer), /w/[slug]/rsvp, and the household
  // save-the-date flow: /w/[slug]/save-the-date, /w/[slug]/save-the-date/[code],
  // /w/[slug]/save-the-date/update
  if (segments[0] === 'w') {
    if (segments.length < 2) return false
    const slug = segments[1]
    if (!slug || isReservedSlug(slug)) return false
    if (segments.length === 2) return true
    if (segments.length === 3 && segments[2] === 'rsvp') return true
    if (segments.length === 3 && segments[2] === 'save-the-date') return true
    if (segments.length === 4 && segments[2] === 'save-the-date') return true
    return false
  }

  return false
}

const isPublicPath = (pathname: string): boolean =>
  PUBLIC_EXACT_PATHS.includes(pathname) ||
  PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
  isPublicTrpcPath(pathname) ||
  isPublicWebsitePath(pathname)

const getLegacyWebsiteRedirect = (req: NextRequest): URL | null => {
  const segments = req.nextUrl.pathname.split('/').filter(Boolean)
  if (segments.length !== 1) return null
  const [slug] = segments
  if (!slug || isReservedSlug(slug)) return null
  return new URL(`/w/${slug}${req.nextUrl.search}`, req.url)
}

const buildLocaleResponse = (req: NextRequest, locale: Locale): NextResponse => {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('X-Locale', locale)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.cookies.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  return response
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const langOverride = req.cookies.get('lang-override')?.value
  const locale: Locale =
    langOverride === 'en' || langOverride === 'es'
      ? langOverride
      : getLocaleFromCountry(req.headers.get('x-vercel-ip-country'))

  if (isPublicPath(pathname)) {
    return buildLocaleResponse(req, locale)
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

  return buildLocaleResponse(req, locale)
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
