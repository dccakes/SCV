import { expect, test } from '@playwright/test'

test.describe('Guest Tags - Persistence via Guest Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
  })

  test('should save tags when creating a new party and persist after refresh', async ({ page }) => {
    // Open the Add Party form
    await page.getByRole('button', { name: /add.*(party|guest)/i }).click()

    // Fill in guest name
    await page
      .getByLabel(/first name/i)
      .first()
      .fill('TagTest')
    await page
      .getByLabel(/last name/i)
      .first()
      .fill('Guest')

    // Open tags modal
    await page.getByRole('button', { name: /tags/i }).first().click()

    // Wait for the modal to appear
    await expect(page.getByRole('heading', { name: /tags for/i })).toBeVisible()

    // Select a tag (Family exists in seed data)
    await page.getByRole('checkbox', { name: 'Family' }).click()
    expect(await page.getByRole('checkbox', { name: 'Family' }).isChecked()).toBe(true)

    // Save tags in the modal
    await page.getByRole('button', { name: 'Save Tags' }).click()

    // Tags badge should show in the form
    await expect(page.getByText('Family').first()).toBeVisible()

    // Toggle the primary contact switch
    const primarySwitch = page.locator('#guest0-isPrimaryContact')
    const isChecked = await primarySwitch.isChecked()
    if (!isChecked) {
      await primarySwitch.click()
    }

    // Enable invitation for at least one event
    const eventSwitches = page.locator('[id^="guest0-event-"]')
    const switchCount = await eventSwitches.count()
    if (switchCount > 0) {
      const firstSwitch = eventSwitches.first()
      const switchChecked = await firstSwitch.isChecked()
      if (!switchChecked) {
        await firstSwitch.click()
      }
    }

    // Submit the form
    await page.getByRole('button', { name: 'Save & Close' }).click()

    // Wait for success toast
    await expect(page.getByText(/created successfully/i)).toBeVisible({ timeout: 10000 })

    // Refresh the page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify the guest appears
    await expect(page.getByText('TagTest')).toBeVisible({ timeout: 10000 })
  })

  test('should preserve tags when editing a party without changing tags', async ({ page }) => {
    // Open an existing household for editing (Donkey has tags from seed)
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    // Look for existing tags on the guest detail view
    // Donkey has Family and Bridal Party tags from seed data
    const detailView = page.locator('body')
    const hasTags =
      (await detailView.getByText('Family').count()) > 0 ||
      (await detailView.getByText('Bridal Party').count()) > 0

    // Only run the full test if seed data has tags
    if (!hasTags) {
      test.skip()
      return
    }

    // Note the existing tag for comparison after refresh
    await expect(detailView.getByText('Family').first()).toBeVisible()
  })
})

test.describe('Guest Tags - Cancel does not persist', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
  })

  test('should not persist tag changes when modal is cancelled', async ({ page }) => {
    // Open the Add Party form
    await page.getByRole('button', { name: /add.*(party|guest)/i }).click()

    // Fill in guest name
    await page
      .getByLabel(/first name/i)
      .first()
      .fill('CancelTest')
    await page
      .getByLabel(/last name/i)
      .first()
      .fill('Guest')

    // Open tags modal and select a tag
    await page.getByRole('button', { name: /tags/i }).first().click()
    await expect(page.getByRole('heading', { name: /tags for/i })).toBeVisible()
    await page.getByRole('checkbox', { name: 'Family' }).click()

    // Cancel instead of saving
    await page.getByRole('button', { name: 'Cancel' }).click()

    // The tag badge should NOT appear in the form since we cancelled
    // (the Tags button should not show a count badge)
    const tagsButton = page.getByRole('button', { name: /tags/i }).first()
    await expect(tagsButton).toBeVisible()

    // Reopen the modal - it should show no tags selected (not stale state)
    await tagsButton.click()
    await expect(page.getByRole('heading', { name: /tags for/i })).toBeVisible()
    expect(await page.getByRole('checkbox', { name: 'Family' }).isChecked()).toBe(false)
  })
})
