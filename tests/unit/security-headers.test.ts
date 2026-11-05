import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildContentSecurityPolicy, buildSecurityHeaders } from '~/security-headers'

const headerMap = (isDev = false) =>
  Object.fromEntries(buildSecurityHeaders({ isDev }).map((h) => [h.key, h.value]))

describe('buildSecurityHeaders', () => {
  it('includes the baseline security headers', () => {
    const headers = headerMap()

    expect(headers['Strict-Transport-Security']).toBe('max-age=63072000')
    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['X-Frame-Options']).toBe('DENY')
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin')
    for (const feature of ['camera', 'microphone', 'geolocation', 'payment', 'usb']) {
      expect(headers['Permissions-Policy']).toContain(`${feature}=()`)
    }
    expect(headers['Content-Security-Policy']).toBeDefined()
  })
})

describe('buildContentSecurityPolicy', () => {
  it('locks down framing, plugins, base URI and form targets', () => {
    const csp = buildContentSecurityPolicy()

    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain("form-action 'self'")
  })

  it('never allows unsafe-eval or http upgrade gaps in production', () => {
    const csp = buildContentSecurityPolicy({ isDev: false })

    expect(csp).not.toContain('unsafe-eval')
    expect(csp).toContain('upgrade-insecure-requests')
  })

  it('allows unsafe-eval only in development', () => {
    const csp = buildContentSecurityPolicy({ isDev: true })

    expect(csp).toContain("'unsafe-eval'")
    expect(csp).not.toContain('upgrade-insecure-requests')
  })

  it('keeps the origins the app depends on reachable', () => {
    const csp = buildContentSecurityPolicy()

    // Same-origin PostHog proxy, Vercel Blob uploads, vendor PDFs, blob: workers and previews.
    expect(csp).toContain("connect-src 'self' https://vercel.com")
    expect(csp).toContain('frame-src')
    expect(csp).toContain('https://*.public.blob.vercel-storage.com')
    expect(csp).toContain("worker-src 'self' blob:")
    expect(csp).toContain("img-src 'self' data: blob: https:")
  })
})

describe('CSP shape', () => {
  const directives = (isDev: boolean) =>
    buildContentSecurityPolicy({ isDev })
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name = '', ...values] = part.split(/\s+/)
        return { name, values }
      })

  it('has no duplicate directives', () => {
    const names = directives(false).map((d) => d.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('never allows a bare wildcard or remote scripts', () => {
    for (const { name, values } of directives(false)) {
      expect(values).not.toContain('*')
      if (name === 'script-src') {
        expect(values).not.toContain('https:')
        expect(values.filter((v) => v.startsWith('http'))).toEqual([])
      }
    }
  })

  it('sends each header key once', () => {
    const keys = buildSecurityHeaders().map((h) => h.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('next.config.js wiring', () => {
  const config = readFileSync(join(process.cwd(), 'next.config.js'), 'utf8')

  it('applies the security headers to every path and hides the framework header', () => {
    expect(config).toContain('buildSecurityHeaders(')
    expect(config).toContain("source: '/:path*'")
    expect(config).toContain('poweredByHeader: false')
  })

  it('only builds the dev CSP outside production', () => {
    expect(config).toContain("isDev: process.env.NODE_ENV !== 'production'")
  })
})
