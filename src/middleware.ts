import { getSessionCookie } from 'better-auth/cookies'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Define protected routes
const protectedRoutes = ['/dashboard', '/guest-list', '/events', '/vendors', '/settings', '/inbox']

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute) {
    // Check for session token using Better Auth's utility (handles cookie prefixes)
    const sessionToken = getSessionCookie(req)

    // Redirect to home if not authenticated
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/', req.url))
    }
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
