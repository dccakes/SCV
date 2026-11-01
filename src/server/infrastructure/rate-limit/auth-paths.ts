/**
 * Classifies Better Auth requests for rate limiting.
 *
 * Only paths we know about get their own bucket. Everything else (unknown paths that will 404,
 * or ordinary session traffic) shares one bucket per IP, so an attacker cannot mint unlimited
 * rate limit rows or oversized keys by varying the URL.
 */

import type { RateLimitPolicy } from '~/server/infrastructure/rate-limit/enforce'

const AUTH_PREFIX = '/api/auth'

/**
 * Endpoints that create accounts, send email, change credentials or accept guessable secrets
 * (passwords, OTPs). Paths are relative to /api/auth and compared lowercased.
 */
export const SENSITIVE_AUTH_PATHS: ReadonlySet<string> = new Set([
  '/sign-up/email',
  '/sign-in/email',
  '/sign-in/email-otp',
  '/email-otp/send-verification-otp',
  '/email-otp/check-verification-otp',
  '/email-otp/verify-email',
  '/email-otp/request-password-reset',
  '/email-otp/reset-password',
  '/email-otp/request-email-change',
  '/email-otp/change-email',
  '/forget-password',
  '/forget-password/email-otp',
  '/request-password-reset',
  '/reset-password',
  '/send-verification-email',
  '/verify-email',
  '/verify-password',
  '/change-password',
])

export interface AuthRateLimitTarget {
  policy: RateLimitPolicy
  /** Bounded key suffix; combine with the client IP. */
  key: string
}

export function getAuthRateLimitTarget(pathname: string): AuthRateLimitTarget {
  const authPath = pathname.startsWith(AUTH_PREFIX) ? pathname.slice(AUTH_PREFIX.length) : pathname
  const normalized = authPath.toLowerCase()

  if (SENSITIVE_AUTH_PATHS.has(normalized)) {
    return { policy: 'authSensitive', key: normalized }
  }
  return { policy: 'authDefault', key: 'other' }
}
