import {
  parseSampleRate,
  posthogOtlpUrl,
  resolveServerPostHogTarget,
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

describe('resolveServerPostHogTarget', () => {
  it('is disabled when no project token is configured', () => {
    expect(resolveServerPostHogTarget({})).toBeNull()
    expect(resolveServerPostHogTarget({ POSTHOG_KEY: '  ' })).toBeNull()
  })

  it('prefers the server key and falls back to the public project token', () => {
    expect(
      resolveServerPostHogTarget({
        POSTHOG_KEY: 'phc_server',
        NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: 'phc_pub',
      })
    ).toEqual({ token: 'phc_server', host: 'https://us.i.posthog.com' })
    expect(
      resolveServerPostHogTarget({ NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: 'phc_pub' })?.token
    ).toBe('phc_pub')
  })

  it('uses POSTHOG_HOST for ingestion but never the public UI host', () => {
    expect(
      resolveServerPostHogTarget({ POSTHOG_KEY: 'phc_x', POSTHOG_HOST: 'https://eu.i.posthog.com' })
        ?.host
    ).toBe('https://eu.i.posthog.com')
    expect(
      resolveServerPostHogTarget({
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

describe('POSTHOG_PROXY_PATH', () => {
  it('matches the reverse-proxy rewrites in next.config.js', () => {
    // next.config.js can't import TypeScript, so its rewrites repeat the path.
    const { readFileSync } = require('node:fs') as typeof import('node:fs')
    const { join } = require('node:path') as typeof import('node:path')
    const { POSTHOG_PROXY_PATH } =
      require('~/lib/observability/config') as typeof import('~/lib/observability/config')
    const nextConfig = readFileSync(join(process.cwd(), 'next.config.js'), 'utf8')

    const sources = [...nextConfig.matchAll(/source: '([^']+)'/g)].map((match) => match[1])
    expect(sources).toEqual([
      `${POSTHOG_PROXY_PATH}/static/:path*`,
      `${POSTHOG_PROXY_PATH}/array/:path*`,
      `${POSTHOG_PROXY_PATH}/:path*`,
    ])
  })
})
