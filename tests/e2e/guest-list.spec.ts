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

  test('should show primary guest list controls', async ({ page }) => {
    await page.goto('/guest-list')

    await expect(page.getByPlaceholder('Find guests')).toBeVisible()
    await expect(page.getByRole('button', { name: 'RSVP Status' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Guest Tag' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Country' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sort by Name' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sort by Party Size' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Card view' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Table view' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Import Guests' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Guest' })).toBeVisible()
  })
})
