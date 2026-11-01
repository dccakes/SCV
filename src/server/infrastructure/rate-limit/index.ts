/**
 * Rate Limit Infrastructure - Barrel Export
 */

export { getClientIp } from '~/server/infrastructure/rate-limit/client-ip'
export {
  enforceRateLimit,
  RATE_LIMIT_POLICIES,
  type RateLimitPolicy,
  rateLimitedResponse,
} from '~/server/infrastructure/rate-limit/enforce'
export {
  PrismaRateLimiter,
  type RateLimiterOptions,
  type RateLimitResult,
} from '~/server/infrastructure/rate-limit/prisma-rate-limiter'
