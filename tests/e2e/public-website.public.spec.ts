import { expect, test } from '@playwright/test'

test.describe('Public Wedding Website', () => {
  test('should load the public wedding website by subUrl', async ({ page }) => {
    // Seed website subUrl is "shrek-fiona"
    await page.goto('/shrek-fiona')

    await expect(page.locator('body')).not.toContainText('Application error')
    // Should show the wedding couple's info
    const body = page.locator('body')
    await expect(body).toContainText(/shrek|fiona/i)
  })

  test('should display wedding events on public site', async ({ page }) => {
    await page.goto('/shrek-fiona')

    const body = page.locator('body')
    // Public site should show event details
    await expect(body).toContainText(/ceremony|feast|breakfast/i)
  })

  test('should load the RSVP page', async ({ page }) => {
    await page.goto('/shrek-fiona/rsvp')

    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('should return 404 for non-existent wedding website', async ({ page }) => {
    await page.goto('/non-existent-wedding-url')

    // The app renders a custom "not found" page
    const body = page.locator('body')
    await expect(body).toContainText(/page not found/i)
  })
})

test.describe('Guest Self-Fill Registration', () => {
  test('should load the self-fill join page with valid token', async ({ page }) => {
    // Seed selfFillToken (prisma/seed-fixture.json). Tokens are 32 hex characters.
    await page.goto('/join/5a3c0f1e2b4d6a8c9e0f1a2b3c4d5e6f')

    await expect(page.locator('body')).not.toContainText('Application error')
    // The wedding lookup must succeed: a gated or rejected tRPC call shows "Link Not Found".
    await expect(page.getByLabel(/first name/i)).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/link not found/i)
  })
})

test.describe('Landing Page', () => {
  test('should load the home page without errors', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('body')).not.toContainText('Application error')
    // Page should render the OSWP branding
    const body = page.locator('body')
    await expect(body).toContainText('OSWP')
  })
})
