import { expect, test } from '@playwright/test'

async function loginAsSeedUser(page: import('@playwright/test').Page, email: string) {
  await page.goto('/auth/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Login' }).click()
}

test.describe('Permissions Matrix Smoke', () => {
  test('owner session can access protected management pages', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')

    await page.goto('/events')
    await expect(page).toHaveURL('/events')

    await page.goto('/guest-list')
    await expect(page).toHaveURL('/guest-list')

    await page.goto('/vendors')
    await expect(page).toHaveURL('/vendors')

    await page.goto('/settings', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await expect(page).toHaveURL('/settings')
  })

  test('unauthenticated users are blocked from protected pages', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const page = await context.newPage()

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=%2Fdashboard$/)

    await page.goto('/events')
    await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=%2Fevents$/)

    await page.goto('/guest-list')
    await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=%2Fguest-list$/)

    await page.goto('/vendors')
    await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=%2Fvendors$/)

    await page.goto('/settings')
    await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=%2Fsettings$/)

    await context.close()
  })

  test('member session can still access planning pages', async ({ browser }) => {
    test.setTimeout(60_000)
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const page = await context.newPage()

    await loginAsSeedUser(page, 'fiona@swamp.wed')
    await page.waitForURL('/dashboard', { timeout: 15_000 })
    await expect(page).toHaveURL('/dashboard')

    await page.goto('/events')
    await expect(page).toHaveURL('/events')

    await page.goto('/guest-list')
    await expect(page).toHaveURL('/guest-list')

    await page.goto('/vendors')
    await expect(page).toHaveURL('/vendors')

    await page.goto('/settings', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await expect(page).toHaveURL('/settings')

    await context.close()
  })

  test('viewer session is blocked from protected management pages', async ({ browser }) => {
    test.setTimeout(60_000)
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const page = await context.newPage()

    await loginAsSeedUser(page, 'queen.lillian@swamp.wed')
    await page.waitForURL('/', { timeout: 15_000 })
    await expect(page).toHaveURL('/')

    await page.goto('/dashboard')
    await expect(page).toHaveURL('/')

    await page.goto('/events')
    await expect(page).toHaveURL('/')

    await page.goto('/guest-list')
    await expect(page).toHaveURL('/')

    await page.goto('/vendors')
    await expect(page).toHaveURL('/')

    await page.goto('/settings', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await expect(page).toHaveURL('/')

    await context.close()
  })

  test('public RSVP route remains accessible without auth', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const page = await context.newPage()

    await page.goto('/shrek-fiona/rsvp')
    await expect(page.locator('body')).not.toContainText('Application error')

    await context.close()
  })

  test('dashboard renders manage RSVPs CTA on the RSVP card', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: 'Manage RSVPs →' })).toHaveAttribute(
      'href',
      '/guest-list'
    )
  })
})
