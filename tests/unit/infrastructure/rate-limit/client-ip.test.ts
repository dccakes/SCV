import { getClientIp, normalizeIp } from '~/server/infrastructure/rate-limit/client-ip'

describe('getClientIp', () => {
  it('prefers x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' })
    expect(getClientIp(headers)).toBe('1.1.1.1')
  })

  it('falls back to the first x-forwarded-for entry', () => {
    const headers = new Headers({ 'x-forwarded-for': ' 2.2.2.2 , 10.0.0.1' })
    expect(getClientIp(headers)).toBe('2.2.2.2')
  })

  it('falls through to x-forwarded-for when x-real-ip is blank', () => {
    const headers = new Headers({ 'x-real-ip': '   ', 'x-forwarded-for': '2.2.2.2' })
    expect(getClientIp(headers)).toBe('2.2.2.2')
  })

  it('returns null when no IP header is present', () => {
    expect(getClientIp(new Headers())).toBeNull()
    expect(getClientIp(undefined)).toBeNull()
  })

  it.each([
    '127.0.0.1',
    '127.5.5.5',
    '::1',
    '::',
    '::ffff:127.0.0.1',
  ])('treats loopback %s as no client IP so local dev and CI are not limited', (ip) => {
    expect(getClientIp(new Headers({ 'x-real-ip': ip }))).toBeNull()
    expect(getClientIp(new Headers({ 'x-forwarded-for': ip }))).toBeNull()
  })

  it('still limits a real client that is not loopback', () => {
    expect(getClientIp(new Headers({ 'x-forwarded-for': '203.0.113.9' }))).toBe('203.0.113.9')
    expect(getClientIp(new Headers({ 'x-real-ip': '2001:db8::1' }))).toBe('2001:db8:0:0::/64')
  })

  it('maps a present but malformed header to the shared invalid bucket', () => {
    expect(getClientIp(new Headers({ 'x-real-ip': 'unknown' }))).toBe('invalid')
    expect(getClientIp(new Headers({ 'x-forwarded-for': 'a'.repeat(5_000) }))).toBe('invalid')
  })
})

describe('normalizeIp', () => {
  it('leaves IPv4 untouched', () => {
    expect(normalizeIp('203.0.113.7')).toBe('203.0.113.7')
  })

  it('reduces IPv6 to its /64 so one subscriber cannot rotate through buckets', () => {
    const a = normalizeIp('2001:db8:abcd:12:aaaa:bbbb:cccc:dddd')
    const b = normalizeIp('2001:db8:abcd:12::1')

    expect(a).toBe('2001:db8:abcd:12::/64')
    expect(b).toBe(a)
    expect(normalizeIp('2001:db8:abcd:13::1')).not.toBe(a)
  })

  it('expands compressed IPv6 correctly', () => {
    expect(normalizeIp('2001:db8::1')).toBe('2001:db8:0:0::/64')
    expect(normalizeIp('::1')).toBe('0:0:0:0::/64')
    expect(normalizeIp('fe80::1%eth0')).toBe('fe80:0:0:0::/64')
  })

  it('treats IPv4-mapped IPv6 as the plain IPv4 address', () => {
    expect(normalizeIp('::ffff:1.2.3.4')).toBe('1.2.3.4')
    expect(normalizeIp('::ffff:102:304')).toBe('1.2.3.4')
  })

  it('rejects anything that is not an IP address', () => {
    expect(normalizeIp('not-an-ip')).toBe('invalid')
    expect(normalizeIp('')).toBe('invalid')
    expect(normalizeIp('1.2.3.4.5')).toBe('invalid')
  })
})
