import { expect, test } from '@playwright/test'

test.describe('Permissions Matrix Smoke', () => {
  test('owner session can access protected management pages', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')

    await page.goto('/events')
    await expect(page).toHaveURL('/events')

    await page.goto('/guest-list')
    await expect(page).toHaveURL('/guest-list')

    await page.goto('/vendors')
    await expect(page).toHaveURL('/vendors')
  })

  test('unauthenticated users are blocked from protected pages', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const page = await context.newPage()

    await page.goto('/dashboard')
    await expect(page).toHaveURL('/')

    await page.goto('/events')
    await expect(page).toHaveURL('/')

    await page.goto('/guest-list')
    await expect(page).toHaveURL('/')

    await page.goto('/vendors')
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
})
