import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Define protected routes
const protectedRoutes = ['/dashboard', '/guest-list']

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Store current request url in a custom header
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-url', pathname)

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute) {
    // Check for session token in cookies (Better Auth default cookie name)
    const sessionToken = req.cookies.get('better-auth.session_token')

    // Redirect to home if not authenticated
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
