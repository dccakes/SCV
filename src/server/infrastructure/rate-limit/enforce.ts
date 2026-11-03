/**
 * Named rate limit policies plus a small enforcement helper shared by route handlers and
 * tRPC middleware.
 *
 * Fail-open: if the limiter's database call throws or takes longer than LIMITER_TIMEOUT_MS we
 * log and let the request through. Rate limiting is abuse protection, and an outage in this
 * table should not take sign-in or the public wedding sites down with it.
 */

import { logger } from '~/lib/observability/logger'
import { TOO_MANY_REQUESTS_MESSAGE } from '~/lib/rate-limit-message'
import { db } from '~/server/db'
import {
  PrismaRateLimiter,
  type RateLimiterOptions,
} from '~/server/infrastructure/rate-limit/prisma-rate-limiter'

const MINUTE = 60_000

/** A hung database must not hang every auth and public request behind it. */
const LIMITER_TIMEOUT_MS = 2_000

export const RATE_LIMIT_POLICIES = {
  /** Account creation, sign-in, OTP and password reset endpoints. Per IP and endpoint. */
  authSensitive: { limit: 10, windowMs: 10 * MINUTE },
  /** Every other write call to the auth API, pooled per IP (not per endpoint). */
  authDefault: { limit: 300, windowMs: MINUTE },
  /** Unauthenticated tRPC procedures. Per IP and procedure. Generous: guests often share venue wifi. */
  publicTrpc: { limit: 120, windowMs: MINUTE },
  /** Guessable secrets on public procedures, such as the wedding website password. */
  publicTrpcStrict: { limit: 10, windowMs: MINUTE },
  /** Etta chat requests (each one costs LLM spend). Per couple user or guest. */
  etta: { limit: 20, windowMs: MINUTE },
} as const satisfies Record<string, RateLimiterOptions>

export type RateLimitPolicy = keyof typeof RATE_LIMIT_POLICIES

const limiters = new Map<RateLimitPolicy, PrismaRateLimiter>()

function getLimiter(policy: RateLimitPolicy): PrismaRateLimiter {
  let limiter = limiters.get(policy)
  if (!limiter) {
    limiter = new PrismaRateLimiter(db, RATE_LIMIT_POLICIES[policy])
    limiters.set(policy, limiter)
  }
  return limiter
}

export interface EnforceResult {
  allowed: boolean
  retryAfterSeconds: number
  /** Null when the limiter failed open, in which case no rate limit headers are sent. */
  limit: number | null
  remaining: number
  resetSeconds: number
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Rate limiter timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/** Counts one hit against `policy` for `key` (policy name is added to the key automatically). */
export async function enforceRateLimit(
  policy: RateLimitPolicy,
  key: string
): Promise<EnforceResult> {
  try {
    const result = await withTimeout(
      getLimiter(policy).consume(`${policy}:${key}`),
      LIMITER_TIMEOUT_MS
    )
    return {
      allowed: result.allowed,
      retryAfterSeconds: Math.max(1, Math.ceil(result.retryAfterMs / 1000)),
      limit: result.limit,
      remaining: result.remaining,
      resetSeconds: Math.ceil(result.resetMs / 1000),
    }
  } catch (error) {
    logger.error(
      'Rate limiter failed, allowing request',
      { component: 'rate-limit', policy },
      error
    )
    return { allowed: true, retryAfterSeconds: 0, limit: null, remaining: 0, resetSeconds: 0 }
  }
}

/**
 * Standard X-RateLimit-* headers (limit, remaining, seconds until the window resets), plus
 * Retry-After when blocked. Empty when the limiter failed open.
 */
export function rateLimitHeaders(result: EnforceResult): Record<string, string> {
  if (result.limit === null) return {}
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetSeconds),
    ...(result.allowed ? {} : { 'Retry-After': String(result.retryAfterSeconds) }),
  }
}

/** Thrown from tRPC middleware so the route handler can set Retry-After on the response. */
export class RateLimitError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super(`Too many requests. Try again in ${retryAfterSeconds} seconds.`)
    this.name = 'RateLimitError'
  }
}

export function rateLimitedResponse(result: EnforceResult): Response {
  return Response.json(
    // `message` is what Better Auth's client and UI read; `error` is kept for other callers.
    { error: TOO_MANY_REQUESTS_MESSAGE, message: TOO_MANY_REQUESTS_MESSAGE },
    { status: 429, headers: rateLimitHeaders(result) }
  )
}
