import {
  getAuthRateLimitTarget,
  SENSITIVE_AUTH_PATHS,
} from '~/server/infrastructure/rate-limit/auth-paths'

describe('getAuthRateLimitTarget', () => {
  it.each([...SENSITIVE_AUTH_PATHS])('puts %s on the strict policy with its own key', (path) => {
    expect(getAuthRateLimitTarget(`/api/auth${path}`)).toEqual({
      policy: 'authSensitive',
      key: path,
    })
  })

  it('covers the account creation and credential endpoints that matter', () => {
    for (const path of [
      '/sign-up/email',
      '/sign-in/email',
      '/sign-in/email-otp',
      '/email-otp/send-verification-otp',
      '/request-password-reset',
      '/reset-password',
      '/change-password',
      '/email-otp/request-email-change',
    ]) {
      expect(SENSITIVE_AUTH_PATHS.has(path)).toBe(true)
    }
  })

  it('matches case-insensitively so a case variant cannot dodge the strict policy', () => {
    expect(getAuthRateLimitTarget('/api/auth/Sign-In/EMAIL')).toEqual({
      policy: 'authSensitive',
      key: '/sign-in/email',
    })
  })

  it('pools ordinary and unknown paths into one bounded key', () => {
    const expected = { policy: 'authDefault', key: 'other' }

    expect(getAuthRateLimitTarget('/api/auth/sign-out')).toEqual(expected)
    expect(getAuthRateLimitTarget('/api/auth/get-session')).toEqual(expected)
    expect(getAuthRateLimitTarget('/api/auth')).toEqual(expected)
    expect(getAuthRateLimitTarget(`/api/auth/${'x'.repeat(10_000)}`)).toEqual(expected)
    expect(getAuthRateLimitTarget('/api/auth/sign-in/email/')).toEqual(expected)
  })
})
