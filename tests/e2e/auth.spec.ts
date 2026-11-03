import { expect, type Page, test } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should show sign-in page with email and password fields', async ({ page }) => {
    await page.goto('/auth/sign-in')
    await page.waitForLoadState('networkidle')

    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
  })

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/auth/sign-in')
    await page.waitForLoadState('networkidle')

    await page.getByLabel('Email').fill('invalid@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Login' }).click()

    // Should stay on sign-in page and not redirect to dashboard
    await page.waitForTimeout(2000)
    await expect(page).not.toHaveURL('/dashboard')
  })

  test('should sign in with valid seed credentials and reach dashboard', async ({ page }) => {
    await page.goto('/auth/sign-in')
    await page.waitForLoadState('networkidle')

    await page.getByLabel('Email').fill('shrek@swamp.wed')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()

    await page.waitForURL('/dashboard', { timeout: 15_000 })
    await expect(page).toHaveURL('/dashboard')
  })

  test('should redirect unauthenticated users from protected routes', async ({ browser }) => {
    // Use a fresh context with explicitly empty storage state (no cookies/auth)
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await context.newPage()

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=%2Fdashboard$/)

    await page.goto('/guest-list')
    await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=%2Fguest-list$/)

    await page.goto('/events')
    await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=%2Fevents$/)

    await page.goto('/vendors')
    await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=%2Fvendors$/)

    await context.close()
  })

  test('should show sign-up page', async ({ page }) => {
    await page.goto('/auth/sign-up')
    await page.waitForLoadState('networkidle')

    await expect(page.getByLabel('Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })
})

test.describe('Email verification flow', () => {
  // These tests run signed out and stub the auth API, so no account is created and no email is sent.
  test.use({ storageState: { cookies: [], origins: [] } })

  const waitForHydration = (page: Page) =>
    page.waitForFunction(() => document.querySelector('form')?.hasAttribute('novalidate'), {
      timeout: 15_000,
    })

  const stubSignUp = (page: Page) =>
    page.route('**/api/auth/sign-up/email', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: null,
          user: { id: 'stub', email: 'new-user@example.com', emailVerified: false },
        }),
      })
    )

  const submitSignUp = async (page: Page) => {
    await page.getByLabel('Name').fill('New User')
    await page.getByLabel('Email').fill('new-user@example.com')
    await page.getByLabel('Password').fill('a-strong-password-123')
    await page.getByRole('button', { name: 'Create an account' }).click()
  }

  test('should send new sign-ups to the email verification step', async ({ page }) => {
    await stubSignUp(page)

    await page.goto('/auth/sign-up')
    await waitForHydration(page)

    const requestPromise = page.waitForRequest('**/api/auth/sign-up/email')
    await submitSignUp(page)
    const request = await requestPromise

    expect(request.postDataJSON()).toMatchObject({
      name: 'New User',
      email: 'new-user@example.com',
    })
    await expect(page).toHaveURL(/\/auth\/email-verification\?email=new-user%40example\.com$/)
  })

  test('should keep redirectTo when sign-up continues to email verification', async ({ page }) => {
    await stubSignUp(page)
    const redirectTo = '/auth/accept-invitation?invitationId=inv_123'

    await page.goto(`/auth/sign-up?redirectTo=${encodeURIComponent(redirectTo)}`)
    await waitForHydration(page)
    await submitSignUp(page)

    await expect(page).toHaveURL(/\/auth\/email-verification\?/)
    const url = new URL(page.url())
    expect(url.searchParams.get('email')).toBe('new-user@example.com')
    expect(url.searchParams.get('redirectTo')).toBe(redirectTo)
  })

  test('should send unverified sign-ins to the email verification step', async ({ page }) => {
    await page.route('**/api/auth/sign-in/email', (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'EMAIL_NOT_VERIFIED', message: 'Email not verified' }),
      })
    )

    await page.goto('/auth/sign-in')
    await waitForHydration(page)

    await page.getByLabel('Email').fill('unverified@example.com')
    await page.getByLabel('Password').fill('a-strong-password-123')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page).toHaveURL(/\/auth\/email-verification\?email=unverified%40example\.com$/)
  })
})
