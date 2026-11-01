import { getClientIp } from '~/server/infrastructure/rate-limit/client-ip'

describe('getClientIp', () => {
  it('prefers x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' })
    expect(getClientIp(headers)).toBe('1.1.1.1')
  })

  it('falls back to the first x-forwarded-for entry', () => {
    const headers = new Headers({ 'x-forwarded-for': '2.2.2.2, 10.0.0.1' })
    expect(getClientIp(headers)).toBe('2.2.2.2')
  })

  it('returns null when no IP header is present', () => {
    expect(getClientIp(new Headers())).toBeNull()
    expect(getClientIp(undefined)).toBeNull()
  })
})
