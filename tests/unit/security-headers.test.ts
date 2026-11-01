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
    expect(headers['Permissions-Policy']).toContain('camera=()')
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
