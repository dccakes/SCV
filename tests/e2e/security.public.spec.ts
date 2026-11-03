import { expect, test } from '@playwright/test'

/**
 * Covers the security layer end to end on the production build: response headers, an enforced CSP
 * that must still let pages hydrate, the locked cron route, and how the UI words a rate limit.
 * Runs against localhost, which the rate limiter treats as loopback and skips, so 429s are stubbed.
 */

type WindowWithCsp = Window & { __csp: string[] }

test.describe('Security headers', () => {
  test('are served on pages and API routes, and the framework header is hidden', async ({
    request,
  }) => {
    const headers = (await request.get('/auth/sign-in')).headers()

    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(headers['content-security-policy']).toContain("object-src 'none'")
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['strict-transport-security']).toContain('max-age=')
    expect(headers['x-powered-by']).toBeUndefined()

    expect((await request.get('/api/locale')).headers()['x-frame-options']).toBe('DENY')
  })

  test('are not weakened for production: no unsafe-eval in the policy', async ({ request }) => {
    const csp = (await request.get('/auth/sign-in')).headers()['content-security-policy']

    expect(csp).not.toContain('unsafe-eval')
  })
})

test.describe('Enforced CSP', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as WindowWithCsp
      w.__csp = []
      document.addEventListener('securitypolicyviolation', (event) => {
        // Zod probes whether eval works and falls back when it does not: expected and harmless.
        if (event.blockedURI !== 'eval')
          w.__csp.push(`${event.violatedDirective} ${event.blockedURI}`)
      })
    })
  })

  const violations = (page: import('@playwright/test').Page) =>
    page.evaluate(() => (window as unknown as WindowWithCsp).__csp)

  test('lets the sign-in page hydrate and block nothing the app needs', async ({ page }) => {
    await page.goto('/auth/sign-in')
    await expect(page.getByLabel('Email')).toBeVisible()
    await page.waitForLoadState('networkidle')

    expect(await violations(page)).toEqual([])
  })

  // Real public URLs: a bare /<slug>/rsvp is not public and would land on the sign-in page.
  for (const path of ['/', '/w/shrek-fiona', '/w/shrek-fiona/rsvp']) {
    test(`blocks nothing the app needs on ${path}`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      expect(await violations(page)).toEqual([])
    })
  }
})

test.describe('Locked routes', () => {
  test('the rate limit purge cron rejects requests without the cron secret', async ({
    request,
  }) => {
    expect((await request.get('/api/cron/purge-rate-limits')).status()).toBe(403)
    expect(
      (
        await request.get('/api/cron/purge-rate-limits', {
          headers: { authorization: 'Bearer not-the-secret' },
        })
      ).status()
    ).toBe(403)
  })

  test('sign-up is open by default (ALLOW_SIGNUPS is unset in e2e)', async ({ page }) => {
    await page.goto('/auth/sign-up')

    await expect(page).toHaveURL(/\/auth\/sign-up/)
    await expect(page.getByRole('button', { name: 'Create an account' })).toBeVisible()
  })
})

test.describe('Rate limited responses in the UI', () => {
  test('sign-in shows the limit message instead of a silent failure', async ({ page }) => {
    await page.route('**/api/auth/sign-in/email', (route) =>
      route.fulfill({
        status: 429,
        headers: { 'retry-after': '30' },
        json: {
          error: 'Too many requests. Please try again later.',
          message: 'Too many requests. Please try again later.',
        },
      })
    )
    await page.goto('/auth/sign-in')
    await page.getByLabel('Email').fill('someone@example.com')
    await page.getByLabel('Password', { exact: true }).fill('a-password-123')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page.getByText('Too many requests. Please try again later.')).toBeVisible()
    await expect(page).toHaveURL(/\/auth\/sign-in/)
  })

  test('RSVP name search tells a blocked guest the page is busy, not that they are not invited', async ({
    page,
  }) => {
    await page.route('**/api/trpc/household.findBySearchPublic*', (route) =>
      route.fulfill({
        status: 429,
        headers: { 'retry-after': '30' },
        json: [
          {
            error: {
              json: {
                message: 'Too many requests. Try again in 30 seconds.',
                code: -32029,
                data: {
                  code: 'TOO_MANY_REQUESTS',
                  httpStatus: 429,
                  path: 'household.findBySearchPublic',
                },
              },
            },
          },
        ],
      })
    )
    await page.goto('/w/shrek-fiona/rsvp')
    await page.getByPlaceholder(/first and last name/i).fill('Donkey The Donkey')
    await page.getByRole('button', { name: /find your invitation/i }).click()

    await expect(page.getByText(/lots of people are searching right now/i)).toBeVisible()
    await expect(page.getByText(/trouble finding your invite/i)).toHaveCount(0)
  })

  test('the self-register page says it is busy, spends no extra retries, and lets the guest retry', async ({
    page,
  }) => {
    // Stubbed in the browser, so this does not depend on how the proxy gates the real call.
    let lookups = 0
    await page.route('**/api/trpc/selfFill.getByToken*', (route) => {
      lookups += 1
      return route.fulfill({
        status: 429,
        headers: { 'retry-after': '30' },
        json: [
          {
            error: {
              json: {
                message: 'Too many requests. Try again in 30 seconds.',
                code: -32029,
                data: { code: 'TOO_MANY_REQUESTS', httpStatus: 429, path: 'selfFill.getByToken' },
              },
            },
          },
        ],
      })
    })

    await page.goto('/join/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
    await expect(page.getByText("We're Busy Right Now")).toBeVisible()
    // React Query's default retries (1s, 2s, 4s backoff) would add lookups within this wait.
    await page.waitForTimeout(3_000)
    expect(lookups).toBe(1)

    await page.getByRole('button', { name: 'Try Again' }).click()
    await expect.poll(() => lookups).toBe(2)
    await expect(page.getByText("We're Busy Right Now")).toBeVisible()
    await expect(page.getByText('Link Not Found')).toHaveCount(0)
  })
})
