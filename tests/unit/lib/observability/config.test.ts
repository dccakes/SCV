import {
  parseSampleRate,
  posthogOtlpUrl,
  resolveServerOtlpTarget,
} from '~/lib/observability/config'

describe('posthogOtlpUrl', () => {
  it('builds the PostHog OTLP path per signal and tolerates trailing slashes', () => {
    expect(posthogOtlpUrl('https://us.i.posthog.com', 'traces')).toBe(
      'https://us.i.posthog.com/i/v1/traces'
    )
    expect(posthogOtlpUrl('https://eu.i.posthog.com/', 'logs')).toBe(
      'https://eu.i.posthog.com/i/v1/logs'
    )
  })
})

describe('resolveServerOtlpTarget', () => {
  it('is disabled when no project token is configured', () => {
    expect(resolveServerOtlpTarget({})).toBeNull()
    expect(resolveServerOtlpTarget({ POSTHOG_KEY: '  ' })).toBeNull()
  })

  it('prefers the server key and falls back to the public project token', () => {
    expect(
      resolveServerOtlpTarget({
        POSTHOG_KEY: 'phc_server',
        NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: 'phc_pub',
      })
    ).toEqual({ token: 'phc_server', host: 'https://us.i.posthog.com' })
    expect(resolveServerOtlpTarget({ NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: 'phc_pub' })?.token).toBe(
      'phc_pub'
    )
  })

  it('uses POSTHOG_HOST for ingestion but never the public UI host', () => {
    expect(
      resolveServerOtlpTarget({ POSTHOG_KEY: 'phc_x', POSTHOG_HOST: 'https://eu.i.posthog.com' })
        ?.host
    ).toBe('https://eu.i.posthog.com')
    expect(
      resolveServerOtlpTarget({
        POSTHOG_KEY: 'phc_x',
        NEXT_PUBLIC_POSTHOG_HOST: 'https://us.posthog.com',
      })?.host
    ).toBe('https://us.i.posthog.com')
  })
})

describe('parseSampleRate', () => {
  it('accepts rates between 0 and 1', () => {
    expect(parseSampleRate('0')).toBe(0)
    expect(parseSampleRate('0.25')).toBe(0.25)
    expect(parseSampleRate('1')).toBe(1)
  })

  it('falls back for missing or invalid values', () => {
    expect(parseSampleRate(undefined)).toBe(1)
    expect(parseSampleRate('')).toBe(1)
    expect(parseSampleRate('abc', 0.5)).toBe(0.5)
    expect(parseSampleRate('1.5')).toBe(1)
    expect(parseSampleRate('-0.1')).toBe(1)
  })
})
