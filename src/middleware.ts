import { getSessionCookie } from 'better-auth/cookies'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/', '/signin']
const PUBLIC_PREFIXES = ['/api/auth']

const isPublicPath = (pathname: string): boolean => {
  if (PUBLIC_PATHS.includes(pathname)) {
    return true
  }

  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  if (isPublicPath(pathname)) {
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
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
