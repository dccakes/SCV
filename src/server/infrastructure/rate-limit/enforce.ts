/**
 * Named rate limit policies plus a small enforcement helper shared by route handlers and
 * tRPC middleware.
 *
 * Fail-open: if the limiter's database call throws we log and let the request through.
 * Rate limiting is abuse protection, and an outage in this table should not take sign-in or
 * the public wedding sites down with it.
 */

import { logger } from '~/lib/observability/logger'
import { db } from '~/server/db'
import {
  PrismaRateLimiter,
  type RateLimiterOptions,
} from '~/server/infrastructure/rate-limit/prisma-rate-limiter'

const MINUTE = 60_000

export const RATE_LIMIT_POLICIES = {
  /** Account creation, sign-in, OTP and password reset endpoints. Per IP and endpoint. */
  authSensitive: { limit: 10, windowMs: 10 * MINUTE },
  /** Any other write call to the auth API. Per IP and endpoint. */
  authDefault: { limit: 60, windowMs: MINUTE },
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
}

/** Counts one hit against `policy` for `key` (policy name is added to the key automatically). */
export async function enforceRateLimit(
  policy: RateLimitPolicy,
  key: string
): Promise<EnforceResult> {
  try {
    const { allowed, retryAfterMs } = await getLimiter(policy).consume(`${policy}:${key}`)
    return { allowed, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) }
  } catch (error) {
    logger.error(
      'Rate limiter failed, allowing request',
      { component: 'rate-limit', policy },
      error
    )
    return { allowed: true, retryAfterSeconds: 0 }
  }
}

export function rateLimitedResponse(retryAfterSeconds: number): Response {
  return Response.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  )
}
