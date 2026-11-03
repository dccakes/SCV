/**
 * Best-effort client IP extraction for rate limiting.
 *
 * TRUST MODEL: this reads x-real-ip, then the first x-forwarded-for entry. On Vercel the platform
 * sets both and overwrites any client-supplied value, so they are trustworthy there. Everywhere
 * else (self-hosting, `next start`) a client can send either header itself: Next.js only fills
 * x-forwarded-for from the socket when the header is absent. A spoofed header can therefore pick
 * its own bucket, or send a loopback address to opt out of limiting entirely. If you self-host,
 * put a proxy in front that overwrites both headers, or do not rely on this limiter.
 * TODO(review-quality): decide whether non-Vercel deployments should ignore these headers unless a
 * TRUST_PROXY flag is set.
 *
 * The result is used inside a rate limit key, so it is always validated and bounded:
 * - A trailing :port and IPv6 brackets are stripped before validation.
 * - IPv4-mapped IPv6 (::ffff:1.2.3.4) is reduced to the IPv4 address.
 * - IPv6 is reduced to its /64 prefix, because one subscriber normally owns a whole /64 and
 *   could otherwise rotate through 2^64 buckets.
 * - A header that is present but not a valid IP maps to the shared bucket 'invalid' instead of
 *   being used verbatim (no unbounded keys, and garbage cannot opt out of limiting).
 *
 * Returns null when there is no usable client IP: no header at all, or a loopback or unspecified
 * address. Local development and CI (Playwright) always arrive as 127.0.0.1 or ::1 and would
 * otherwise share one bucket and be blocked after 10 sign-ins, so callers skip limiting on null.
 * Vercel never presents a loopback client, so production is unaffected.
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

/** Removes a `:port` suffix and IPv6 brackets that some proxies add, e.g. 1.2.3.4:5678 or [::1]:443. */
function stripPortAndBrackets(value: string): string {
  const bracketed = /^\[([^\]]+)\](?::\d+)?$/.exec(value)
  if (bracketed?.[1]) return bracketed[1]

  const withPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(value)
  return withPort?.[1] ?? value
}

function isV4Mapped(hextets: number[]): boolean {
  return hextets.slice(0, 5).every((hextet) => hextet === 0) && hextets[5] === 0xffff
}

export function normalizeIp(raw: string): string {
  const ip = stripPortAndBrackets(raw.trim())
  const version = isIP(ip)
  if (version === 0) return INVALID_IP_BUCKET
  if (version === 4) return ip

  const hextets = expandIpv6(ip)
  if (isV4Mapped(hextets)) {
    const high = hextets[6] ?? 0
    const low = hextets[7] ?? 0
    return `${high >> 8}.${high & 0xff}.${low >> 8}.${low & 0xff}`
  }

  return `${hextets
    .slice(0, 4)
    .map((hextet) => hextet.toString(16))
    .join(':')}::/64`
}

/**
 * True only for the loopback and unspecified addresses: 127.0.0.0/8, 0.0.0.0, ::1 and ::.
 * Judged on the full address: other addresses that merely share the ::/64 prefix (for example
 * ::8.8.8.8) are NOT loopback and must still be limited.
 */
function isLoopbackOrUnspecified(raw: string): boolean {
  const ip = stripPortAndBrackets(raw.trim())
  const version = isIP(ip)
  if (version === 4) return ip.startsWith('127.') || ip === '0.0.0.0'
  if (version !== 6) return false

  const hextets = expandIpv6(ip)
  if (isV4Mapped(hextets)) {
    const high = hextets[6] ?? 0
    return high >> 8 === 127 || (high === 0 && hextets[7] === 0)
  }

  const allZeroButLast = hextets.slice(0, 7).every((hextet) => hextet === 0)
  return allZeroButLast && (hextets[7] === 0 || hextets[7] === 1)
}

export function getClientIp(headers: Headers | undefined | null): string | null {
  if (!headers) return null

  const raw =
    headers.get('x-real-ip')?.trim() || headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (!raw) return null

  return isLoopbackOrUnspecified(raw) ? null : normalizeIp(raw)
}
