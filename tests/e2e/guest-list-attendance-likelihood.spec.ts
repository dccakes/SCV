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
    // All 5 labels should be visible
    await expect(page.getByText('Unlikely')).toBeVisible()
    await expect(page.getByText('Not Sure')).toBeVisible()
    await expect(page.getByText('Maybe')).toBeVisible()
    await expect(page.getByText('Likely')).toBeVisible()
    await expect(page.getByText('Very Likely')).toBeVisible()
  })

  test('should set likelihood, save, and persist after reopening drawer', async ({ page }) => {
    // Open the Donkey household drawer
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await expect(page.getByRole('slider')).toBeVisible()

    // Move slider to the right using keyboard (ArrowRight increases value)
    const slider = page.getByRole('slider')
    await slider.focus()
    // Press ArrowRight multiple times to set to max (Very Likely = 5)
    await slider.press('End') // Jump to max value

    // Slider should now be at 5
    await expect(slider).toHaveAttribute('aria-valuenow', '5')

    // Save button should appear (dirty state)
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible()
    await page.getByRole('button', { name: 'Save changes' }).click()

    // Wait for save to complete (save button disappears)
    await expect(page.getByRole('button', { name: 'Save changes' })).not.toBeVisible()

    // Close and reopen the drawer
    await page.getByLabel('Close guest details').click()
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    // Slider should still be at 5
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '5')
    // "Drag slider to set likelihood" should NOT be shown
    await expect(page.getByText('Drag slider to set likelihood')).not.toBeVisible()
  })

  test('should update likelihood value and persist new value', async ({ page }) => {
    // Open the Donkey household drawer
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    const slider = page.getByRole('slider')
    await slider.focus()

    // Set to 5 first
    await slider.press('End')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('button', { name: 'Save changes' })).not.toBeVisible()

    // Now change to 2 (press Home to go to 1, then ArrowRight to get to 2)
    await slider.focus()
    await slider.press('Home')
    await slider.press('ArrowRight')
    await expect(slider).toHaveAttribute('aria-valuenow', '2')

    // Save the new value
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('button', { name: 'Save changes' })).not.toBeVisible()

    // Close and reopen — should persist at 2
    await page.getByLabel('Close guest details').click()
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '2')
  })

  test('should persist likelihood after full page reload', async ({ page }) => {
    // Open the Donkey household drawer and set likelihood
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    const slider = page.getByRole('slider')
    await slider.focus()
    await slider.press('End') // Set to 5
    await expect(slider).toHaveAttribute('aria-valuenow', '5')

    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('button', { name: 'Save changes' })).not.toBeVisible()

    // Full page reload
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Reopen the drawer
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    // Slider should still show 5 after reload
    await expect(page.getByRole('slider')).toHaveAttribute('aria-valuenow', '5')
  })
})
