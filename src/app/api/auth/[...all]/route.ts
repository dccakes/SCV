import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '~/lib/auth'
import {
  enforceRateLimit,
  getClientIp,
  type RateLimitPolicy,
  rateLimitedResponse,
} from '~/server/infrastructure/rate-limit'

const handlers = toNextJsHandler(auth.handler)

export const GET = handlers.GET

/**
 * Endpoints that create accounts, send email, or accept guessable secrets (passwords, OTPs).
 * These get the strict per-IP policy; every other write call gets the looser default.
 */
const SENSITIVE_AUTH_PATHS = new Set([
  '/sign-up/email',
  '/sign-in/email',
  '/sign-in/email-otp',
  '/email-otp/send-verification-otp',
  '/email-otp/check-verification-otp',
  '/email-otp/verify-email',
  '/email-otp/request-password-reset',
  '/email-otp/reset-password',
  '/forget-password',
  '/forget-password/email-otp',
  '/request-password-reset',
  '/reset-password',
  '/send-verification-email',
  '/verify-email',
])

const AUTH_PREFIX = '/api/auth'

export async function POST(req: Request): Promise<Response> {
  const ip = getClientIp(req.headers)

  // No IP (local dev without a proxy): skip rather than share one bucket across everyone.
  if (ip) {
    const authPath = new URL(req.url).pathname.slice(AUTH_PREFIX.length) || '/'
    const policy: RateLimitPolicy = SENSITIVE_AUTH_PATHS.has(authPath)
      ? 'authSensitive'
      : 'authDefault'
    const { allowed, retryAfterSeconds } = await enforceRateLimit(policy, `${authPath}:${ip}`)
    if (!allowed) {
      return rateLimitedResponse(retryAfterSeconds)
    }
  }

  return handlers.POST(req)
}
