import { expect, test } from '@playwright/test'

test.describe('Guest List Drawer - Attendance Likelihood Slider', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
  })

  test('should display attendance likelihood section in the drawer', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    await expect(page.getByText('Attendance Likelihood')).toBeVisible()
    await expect(page.getByRole('slider')).toBeVisible()
    await expect(page.getByText('Unlikely', { exact: true })).toBeVisible()
    await expect(page.getByText('Not Sure', { exact: true })).toBeVisible()
    await expect(page.getByText('Maybe', { exact: true })).toBeVisible()
    await expect(page.getByText('Likely', { exact: true })).toBeVisible()
    await expect(page.getByText('Very Likely', { exact: true })).toBeVisible()
  })

  test('should set likelihood, save, and persist after reopening drawer', async ({ page }) => {
    // Use Gingy household (single member, simpler state)
    await page.getByRole('button', { name: /select gingy.*household/i }).click()
    await expect(page.getByRole('slider')).toBeVisible()

    const slider = page.getByRole('slider')
    await slider.focus()
    // Set to min first to ensure a known state, then move to target
    await slider.press('Home')
    await slider.press('ArrowRight') // → 2
    await expect(slider).toHaveAttribute('aria-valuenow', '2')

    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('button', { name: 'Save changes' })).not.toBeVisible({
      timeout: 10_000,
    })

    // Close and reopen the drawer
    await page.getByLabel('Close guest details').click()
    await expect(page.getByRole('heading', { name: /gingy cookie/i })).not.toBeVisible()
    await page.getByRole('button', { name: /select gingy.*household/i }).click()

    // Slider should still be at 2
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '2')
    await expect(page.getByText('Drag slider to set likelihood')).not.toBeVisible()
  })

  test('should update likelihood value and persist new value', async ({ page }) => {
    // Use Gingy household — previous test left it at 2
    await page.getByRole('button', { name: /select gingy.*household/i }).click()

    const slider = page.getByRole('slider')
    await slider.focus()

    // Change to 5 (different from the saved 2)
    await slider.press('End')
    await expect(slider).toHaveAttribute('aria-valuenow', '5')

    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('button', { name: 'Save changes' })).not.toBeVisible({
      timeout: 10_000,
    })

    // Close and reopen — should persist at 5
    await page.getByLabel('Close guest details').click()
    await expect(page.getByRole('heading', { name: /gingy cookie/i })).not.toBeVisible()
    await page.getByRole('button', { name: /select gingy.*household/i }).click()
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '5')
  })

  test('should persist likelihood after full page reload', async ({ page }) => {
    // Use Three Bears household (fresh, no likelihood set by other tests)
    await page.getByRole('button', { name: /select papa.*household/i }).click()

    const slider = page.getByRole('slider')
    await slider.focus()
    // Set to 4 (Likely)
    await slider.press('End')
    await slider.press('ArrowLeft') // 5 → 4
    await expect(slider).toHaveAttribute('aria-valuenow', '4')

    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('button', { name: 'Save changes' })).not.toBeVisible({
      timeout: 10_000,
    })

    // Full page reload
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Reopen the drawer
    await page.getByRole('button', { name: /select papa.*household/i }).click()

    // Slider should still show 4 after reload
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '4')
  })
})
