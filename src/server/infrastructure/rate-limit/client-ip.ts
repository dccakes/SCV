/**
 * Best-effort client IP extraction for rate limiting.
 *
 * On Vercel the platform sets x-real-ip / x-forwarded-for itself and overwrites any
 * client-supplied value, so these are trustworthy there. If you self-host, make sure your
 * reverse proxy overwrites (not appends to) these headers or clients can spoof their bucket.
 *
 * Returns null when no IP is available (e.g. local dev without a proxy); callers skip
 * limiting in that case rather than lumping every request into one shared bucket.
 */
export function getClientIp(headers: Headers | undefined | null): string | null {
  if (!headers) return null

  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwardedFor || null
}
