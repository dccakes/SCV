import { expect, test } from '@playwright/test'

test.describe('Settings', () => {
  test('should load the settings page', async ({ page }) => {
    await page.goto('/settings')

    await expect(page).toHaveURL('/settings')
    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('should show Connections tab', async ({ page }) => {
    await page.goto('/settings')

    await expect(page.locator('body')).toContainText(/connections/i)
  })

  test('should show Gmail connection card', async ({ page }) => {
    await page.goto('/settings?tab=connections')

    // The Gmail card should display with its title
    await expect(page.locator('body')).toContainText('Gmail')
  })

  test('should show Connect button when Gmail is not connected', async ({ page }) => {
    await page.goto('/settings?tab=connections')

    await expect(page.getByRole('button', { name: /connect/i })).toBeVisible()
  })

  test('should show description about reading emails', async ({ page }) => {
    await page.goto('/settings?tab=connections')

    await expect(page.locator('body')).toContainText(/read emails/i)
  })
})
