import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Check if Clerk is enabled
const isClerkEnabled = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY
);

// Define protected routes
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/guest-list(.*)"]);

// Middleware when Clerk is disabled
function withoutClerkMiddleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-url", req.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Middleware when Clerk is enabled
const withClerkMiddleware = clerkMiddleware(async (auth, req) => {
  // Protect dashboard and guest-list routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Store current request url in a custom header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-url", req.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

// Export the appropriate middleware based on Clerk configuration
export default isClerkEnabled ? withClerkMiddleware : withoutClerkMiddleware;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
