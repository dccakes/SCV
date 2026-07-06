import { expect, test } from '@playwright/test'

test.describe('Dashboard', () => {
  test('should load the dashboard page', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL('/dashboard')
    // Dashboard should render without errors
    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('should display wedding couple names', async ({ page }) => {
    await page.goto('/dashboard')

    // The seed data is for Shrek & Fiona's wedding
    await expect(page.locator('body')).toContainText(/shrek/i)
    await expect(page.locator('body')).toContainText(/fiona/i)
  })

  test('should display navigation links to other sections', async ({ page }) => {
    await page.goto('/dashboard')

    // Should have nav links to main sections
    await expect(page.getByRole('link', { name: /guest/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /event/i }).first()).toBeVisible()
  })

  test('should show planning overview with event data', async ({ page }) => {
    await page.goto('/dashboard')

    // The planning overview derives the wedding date and location from the
    // seeded primary event (Swamp Ceremony at "Old Oak Grove, The Swamp") and
    // shows them in the countdown hero, so event data reaching the dashboard is
    // observable even though the overview surfaces milestones rather than a raw
    // event list.
    const body = page.locator('body')
    await expect(body).toContainText(/old oak grove|the swamp/i)
  })
})
