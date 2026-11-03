/**
 * HTTP security headers applied to every response via `headers()` in next.config.js.
 *
 * Plain JS (not TS) because next.config.js can't import TypeScript. The CSP is built here so a
 * unit test can assert on it.
 *
 * CSP notes:
 * - script-src keeps 'unsafe-inline' because Next.js emits inline bootstrap scripts. A nonce
 *   would fix that but forces every page to render dynamically, which would undo static
 *   rendering of the public wedding sites. frame-ancestors, object-src, base-uri and form-action
 *   are locked down regardless.
 * - img-src allows any https origin because vendors' own sites host the images the vendor image
 *   picker shows, and those domains are unknown ahead of time.
 * - PostHog traffic is same-origin (reverse proxy rewrites in next.config.js), so no PostHog
 *   host is listed.
 * - Vercel preview toolbar/comments (vercel.live) are not allowed and will be blocked on preview
 *   deployments.
 * - Embeds (YouTube, Vimeo, Maps iframes) on a wedding website would be blocked by frame-src.
 *   TODO(review-quality): add frame-src/media-src entries if couples should be able to embed media.
 */

/**
 * @param {{ isDev?: boolean }} [options]
 * @returns {string}
 */
export function buildContentSecurityPolicy({ isDev = false } = {}) {
  /** @type {Record<string, string[]>} */
  const directives = {
    'default-src': ["'self'"],
    // React dev tooling needs eval for stack reconstruction; never allowed in production.
    'script-src': ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:'],
    // vercel.com: Vercel Blob client uploads. amazonaws.com: legacy S3 cover photo uploads.
    'connect-src': ["'self'", 'https://vercel.com', 'https://*.amazonaws.com'],
    // Vendor quote PDFs render in an iframe from Vercel Blob.
    'frame-src': ["'self'", 'https://*.public.blob.vercel-storage.com'],
    'worker-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  }

  const policy = Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ')

  // Not in `next dev`, which serves plain http. A production build run on http://localhost (e.g.
  // `next start`, Playwright) still loads, because Chromium exempts localhost from the upgrade.
  return isDev ? policy : `${policy}; upgrade-insecure-requests`
}

/**
 * @param {{ isDev?: boolean }} [options]
 * @returns {{ key: string, value: string }[]}
 */
export function buildSecurityHeaders({ isDev = false } = {}) {
  return [
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy({ isDev }) },
    // Matches the 2 year value Vercel sends by default. No includeSubDomains/preload on purpose:
    // those are hard to undo and affect every subdomain of the parent domain.
    { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // Invitation and save-the-date tokens live in URLs; never send them cross-origin in Referer.
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // Legacy equivalent of frame-ancestors 'none' for older browsers.
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    },
  ]
}
