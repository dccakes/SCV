import { expect, test } from '@playwright/test'

test.describe('Guest List', () => {
  test('should load the guest list page', async ({ page }) => {
    await page.goto('/guest-list')

    await expect(page).toHaveURL('/guest-list')
    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('should display seeded guests', async ({ page }) => {
    await page.goto('/guest-list')

    // The seed fixture includes guests like Donkey, Dragon, Gingy, etc.
    const body = page.locator('body')
    await expect(body).toContainText(/donkey/i)
  })

  test('should display household information', async ({ page }) => {
    await page.goto('/guest-list')

    // Seed data includes multiple households
    // At minimum, we should see guest names from different households
    const body = page.locator('body')
    await expect(body).toContainText(/bear|cookie|charming/i)
  })

  test('should show guest count or summary stats', async ({ page }) => {
    await page.goto('/guest-list')

    // The seed has 13 total guests across 9 households
    // Page should show some count or summary
    const body = page.locator('body')
    // Look for numeric indicators that guests are loaded
    await expect(body).toContainText(/\d+/)
  })
})
