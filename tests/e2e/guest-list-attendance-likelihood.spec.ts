import { expect, test } from '@playwright/test'

test.describe('Guest List Drawer - Attendance Likelihood Slider', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
  })

  test('should display attendance likelihood section in the drawer', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    await expect(page.getByText('Attendance Likelihood')).toBeVisible()
    // Slider should be present
    await expect(page.getByRole('slider')).toBeVisible()
    // All 5 labels should be visible (use exact match to avoid "Likely" matching "Unlikely"/"Very Likely")
    await expect(page.getByText('Unlikely', { exact: true })).toBeVisible()
    await expect(page.getByText('Not Sure', { exact: true })).toBeVisible()
    await expect(page.getByText('Maybe', { exact: true })).toBeVisible()
    await expect(page.getByText('Likely', { exact: true })).toBeVisible()
    await expect(page.getByText('Very Likely', { exact: true })).toBeVisible()
  })

  test('should set likelihood, save, and persist after reopening drawer', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await expect(page.getByRole('slider')).toBeVisible()

    const slider = page.getByRole('slider')
    await slider.focus()
    await slider.press('End')

    await expect(slider).toHaveAttribute('aria-valuenow', '5')

    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('button', { name: 'Save changes' })).not.toBeVisible({
      timeout: 10_000,
    })

    // Close and reopen the drawer
    await page.getByLabel('Close guest details').click()
    await expect(page.getByRole('heading', { name: /donkey the donkey/i })).not.toBeVisible()
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '5')
    await expect(page.getByText('Drag slider to set likelihood')).not.toBeVisible()
  })

  test('should update likelihood value and persist new value', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    const slider = page.getByRole('slider')
    await slider.focus()

    // Set to max first
    await slider.press('End')
    await expect(slider).toHaveAttribute('aria-valuenow', '5')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('button', { name: 'Save changes' })).not.toBeVisible({
      timeout: 10_000,
    })

    // Now change to 2
    await slider.focus()
    await slider.press('Home')
    await slider.press('ArrowRight')
    await expect(slider).toHaveAttribute('aria-valuenow', '2')

    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('button', { name: 'Save changes' })).not.toBeVisible({
      timeout: 10_000,
    })

    // Close and reopen — should persist at 2
    await page.getByLabel('Close guest details').click()
    await expect(page.getByRole('heading', { name: /donkey the donkey/i })).not.toBeVisible()
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '2')
  })

  test('should persist likelihood after full page reload', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    const slider = page.getByRole('slider')
    await slider.focus()
    await slider.press('End')
    await expect(slider).toHaveAttribute('aria-valuenow', '5')

    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('button', { name: 'Save changes' })).not.toBeVisible({
      timeout: 10_000,
    })

    // Full page reload
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Reopen the drawer
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '5')
  })
})
