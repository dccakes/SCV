import { expect, test } from '@playwright/test'

test.describe('Manage Event Guests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/events')
  })

  test('should open Manage Guests dialog from event card', async ({ page }) => {
    const manageGuestsButton = page
      .locator('div')
      .filter({ hasText: /swamp ceremony/i })
      .getByRole('button', { name: /manage guests/i })
      .first()

    await manageGuestsButton.click()

    await expect(
      page.getByRole('heading', { name: /manage guests.*swamp ceremony/i })
    ).toBeVisible()
    await expect(page.getByText(/does not send invitations/i)).toBeVisible()
  })

  test('should display guest list with checkboxes in dialog', async ({ page }) => {
    const manageGuestsButton = page
      .locator('div')
      .filter({ hasText: /morning-after breakfast/i })
      .getByRole('button', { name: /manage guests/i })
      .first()

    await manageGuestsButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Wait for guest data to load
    await expect(dialog.locator('label').filter({ hasText: /donkey/i })).toBeVisible()

    // Should show guest names from seed data
    await expect(dialog.getByText(/donkey/i).first()).toBeVisible()

    // Should have Invite All and Uninvite All buttons
    await expect(dialog.getByRole('button', { name: 'Invite All', exact: true })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Uninvite All', exact: true })).toBeVisible()
  })

  test('should filter guests by search', async ({ page }) => {
    const manageGuestsButton = page
      .locator('div')
      .filter({ hasText: /swamp ceremony/i })
      .getByRole('button', { name: /manage guests/i })
      .first()

    await manageGuestsButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('label').filter({ hasText: /donkey/i })).toBeVisible()

    await dialog.getByPlaceholder(/search guests/i).fill('Donkey')
    await expect(dialog.getByText('Donkey The Donkey')).toBeVisible()

    await dialog.getByPlaceholder(/search guests/i).fill('')
  })

  test('should add a guest to an event and then remove them', async ({ page }) => {
    const manageGuestsButton = page
      .locator('div')
      .filter({ hasText: /morning-after breakfast/i })
      .getByRole('button', { name: /manage guests/i })
      .first()

    await manageGuestsButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('label').filter({ hasText: /donkey/i })).toBeVisible()

    // Search for Big Bad Wolf
    await dialog.getByPlaceholder(/search guests/i).fill('Wolf')
    const wolfLabel = dialog.locator('label').filter({ hasText: /big bad wolf/i })
    await expect(wolfLabel).toBeVisible()
    const wolfCheckbox = wolfLabel.locator('[role="checkbox"]')

    // Ensure Wolf starts as NOT invited (reset if needed from a previous failed run)
    const isCurrentlyChecked = await wolfCheckbox.isChecked()
    if (isCurrentlyChecked) {
      await wolfCheckbox.click()
      await dialog.getByRole('button', { name: /save/i }).last().click()
      await expect(dialog).not.toBeVisible()

      // Reopen dialog
      await manageGuestsButton.click()
      await expect(dialog).toBeVisible()
      await expect(dialog.locator('label').filter({ hasText: /donkey/i })).toBeVisible()
      await dialog.getByPlaceholder(/search guests/i).fill('Wolf')
      await expect(wolfLabel).toBeVisible()
    }

    // Wolf should now be unchecked
    await expect(wolfCheckbox).not.toBeChecked()

    // Click to invite
    await wolfCheckbox.click()
    await expect(wolfCheckbox).toBeChecked()

    // Save — should show 1 change
    const saveButton = dialog.getByRole('button', { name: /save.*1 change/i })
    await expect(saveButton).toBeVisible()
    await saveButton.click()

    await expect(dialog).not.toBeVisible()
    await expect(page.getByText(/guest list updated/i)).toBeVisible()

    // --- Reopen and verify Wolf is now invited, then remove ---
    await manageGuestsButton.click()
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('label').filter({ hasText: /donkey/i })).toBeVisible()
    await dialog.getByPlaceholder(/search guests/i).fill('Wolf')

    const wolfCheckboxAgain = dialog
      .locator('label')
      .filter({ hasText: /big bad wolf/i })
      .locator('[role="checkbox"]')

    await expect(wolfCheckboxAgain).toBeChecked()

    // Uninvite
    await wolfCheckboxAgain.click()
    await expect(wolfCheckboxAgain).not.toBeChecked()

    const saveButton2 = dialog.getByRole('button', { name: /save.*1 change/i })
    await expect(saveButton2).toBeVisible()
    await saveButton2.click()

    await expect(dialog).not.toBeVisible()
    await expect(page.getByText(/guest list updated/i)).toBeVisible()
  })

  test('should bulk invite and uninvite guests', async ({ page }) => {
    const manageGuestsButton = page
      .locator('div')
      .filter({ hasText: /morning-after breakfast/i })
      .getByRole('button', { name: /manage guests/i })
      .first()

    await manageGuestsButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('label').filter({ hasText: /donkey/i })).toBeVisible()

    // Reset to known state: uninvite all, then invite all
    await dialog.getByRole('button', { name: 'Uninvite All', exact: true }).click()
    await dialog.getByRole('button', { name: 'Invite All', exact: true }).click()

    // Save — should have changes since we went from uninvited → invited
    const saveButton = dialog.getByRole('button', { name: /save/i }).last()
    await expect(saveButton).toBeEnabled()
    await saveButton.click()

    await expect(dialog).not.toBeVisible()
    await expect(page.getByText(/guest list updated/i)).toBeVisible()

    // Reopen and restore: uninvite all
    await manageGuestsButton.click()
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('label').filter({ hasText: /donkey/i })).toBeVisible()

    await dialog.getByRole('button', { name: 'Uninvite All', exact: true }).click()

    const saveButton2 = dialog.getByRole('button', { name: /save/i }).last()
    await expect(saveButton2).toBeEnabled()
    await saveButton2.click()

    await expect(dialog).not.toBeVisible()
    await expect(page.getByText(/guest list updated/i)).toBeVisible()
  })

  test('should close dialog without saving when clicking cancel', async ({ page }) => {
    const manageGuestsButton = page
      .locator('div')
      .filter({ hasText: /swamp ceremony/i })
      .getByRole('button', { name: /manage guests/i })
      .first()

    await manageGuestsButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: /cancel/i }).click()
    await expect(dialog).not.toBeVisible()
  })
})
