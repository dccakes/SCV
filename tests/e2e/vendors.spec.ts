import { expect, test } from '@playwright/test'

test.describe('Vendors', () => {
  test('should load the vendors page', async ({ page }) => {
    await page.goto('/vendors')

    await expect(page).toHaveURL('/vendors')
    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('should display seeded vendors', async ({ page }) => {
    await page.goto('/vendors')

    const body = page.locator('body')
    // Seed vendors: Far Far Away Banquet Hall, Dragonfire Catering,
    // Magic Mirror Studios, Pied Piper Collective, Swampview Lodge
    await expect(body).toContainText(/banquet hall|dragonfire|magic mirror|pied piper/i)
  })

  test('should show vendor categories', async ({ page }) => {
    await page.goto('/vendors')

    const body = page.locator('body')
    // Seed has categories: VENUE, CATERING, PHOTOGRAPHER, MUSIC
    await expect(body).toContainText(/venue|catering|photographer|music/i)
  })

  test('should show vendor statuses', async ({ page }) => {
    await page.goto('/vendors')

    const body = page.locator('body')
    // Seed statuses: SELECTED, IN_REVIEW, IN_NEGOTIATION, PRE_SELECTED
    await expect(body).toContainText(/selected|review|negotiation/i)
  })
})
