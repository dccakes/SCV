import { expect, test } from '@playwright/test'

test.describe('Inbox', () => {
  test('should load the inbox page', async ({ page }) => {
    await page.goto('/inbox')

    await expect(page).toHaveURL('/inbox')
    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('should show connect Gmail prompt when not connected', async ({ page }) => {
    await page.goto('/inbox')

    await expect(page.locator('body')).toContainText(/connect gmail to get started/i)
  })

  test('should show link to settings page', async ({ page }) => {
    await page.goto('/inbox')

    const settingsLink = page.getByRole('link', { name: /go to settings/i })
    await expect(settingsLink).toBeVisible()
    await expect(settingsLink).toHaveAttribute('href', '/settings?tab=connections')
  })
})
