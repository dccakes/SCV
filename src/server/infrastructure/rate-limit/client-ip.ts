/**
 * Best-effort client IP extraction for rate limiting.
 *
 * On Vercel the platform sets x-real-ip / x-forwarded-for itself and overwrites any
 * client-supplied value, so these are trustworthy there. If you self-host, make sure your
 * reverse proxy overwrites (not appends to) these headers or clients can spoof their bucket.
 *
 * The result is used inside a rate limit key, so it is always validated and bounded:
 * - IPv4-mapped IPv6 (::ffff:1.2.3.4) is reduced to the IPv4 address.
 * - IPv6 is reduced to its /64 prefix, because one subscriber normally owns a whole /64 and
 *   could otherwise rotate through 2^64 buckets.
 * - A header that is present but not a valid IP maps to the shared bucket 'invalid' instead of
 *   being used verbatim (no unbounded keys, and garbage cannot opt out of limiting).
 *
 * Returns null when there is no usable client IP: no header at all, or a loopback address.
 * Next.js fills x-forwarded-for from the socket on every request, so local development and CI
 * (Playwright) always arrive as 127.0.0.1 or ::1 and would otherwise share one bucket and get
 * blocked after 10 sign-ins. Callers skip limiting on null. Vercel never presents a loopback
 * client, so this does not weaken production. Self-hosting behind a same-host proxy that does
 * not forward the client IP is therefore unlimited, as it would be with no header.
 */
import { isIP } from 'node:net'

export const INVALID_IP_BUCKET = 'invalid'

/** Expands any valid IPv6 address to its 8 hextets, as numbers. */
function expandIpv6(address: string): number[] {
  const withoutZone = address.split('%')[0] ?? address
  const [head = '', tail] = withoutZone.split('::')
  const toHextets = (part: string): number[] =>
    part === '' ? [] : part.split(':').map((hextet) => Number.parseInt(hextet, 16))

  // An embedded IPv4 tail (::ffff:1.2.3.4) occupies the last two hextets.
  const expandEmbeddedIpv4 = (hextets: number[], raw: string): number[] => {
    const last = raw.split(':').pop() ?? ''
    if (!last.includes('.')) return hextets
    const octets = last.split('.').map(Number)
    return [
      ...hextets.slice(0, -1),
      ((octets[0] ?? 0) << 8) | (octets[1] ?? 0),
      ((octets[2] ?? 0) << 8) | (octets[3] ?? 0),
    ]
  }

  const headHextets = expandEmbeddedIpv4(toHextets(head), head)
  if (tail === undefined) return headHextets
  const tailHextets = expandEmbeddedIpv4(toHextets(tail), tail)
  const zeros = new Array<number>(8 - headHextets.length - tailHextets.length).fill(0)
  return [...headHextets, ...zeros, ...tailHextets]
}

export function normalizeIp(raw: string): string {
  const ip = raw.trim()
  const version = isIP(ip)
  if (version === 0) return INVALID_IP_BUCKET
  if (version === 4) return ip

  const hextets = expandIpv6(ip)
  const isV4Mapped = hextets.slice(0, 5).every((hextet) => hextet === 0) && hextets[5] === 0xffff
  if (isV4Mapped) {
    const high = hextets[6] ?? 0
    const low = hextets[7] ?? 0
    return `${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`
  }

  return `${hextets
    .slice(0, 4)
    .map((hextet) => hextet.toString(16))
    .join(':')}::/64`
}

/** normalizeIp() output for 127.0.0.0/8, ::1 and :: (all of ::/64 is reserved, in practice loopback). */
function isLoopback(normalized: string): boolean {
  return normalized.startsWith('127.') || normalized === '0:0:0:0::/64'
}

export function getClientIp(headers: Headers | undefined | null): string | null {
  if (!headers) return null

  const raw =
    headers.get('x-real-ip')?.trim() || headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (!raw) return null

  const ip = normalizeIp(raw)
  return isLoopback(ip) ? null : ip
}
