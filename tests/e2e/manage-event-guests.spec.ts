import { expect, test } from '@playwright/test'

test.describe('Manage Event Guests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/events')
  })

  test('should open Manage Guests dialog from event card', async ({ page }) => {
    // Find the Manage Guests button on one of the event cards
    const manageGuestsButton = page
      .locator('div')
      .filter({ hasText: /swamp ceremony/i })
      .getByRole('button', { name: /manage guests/i })
      .first()

    await manageGuestsButton.click()

    // Dialog should open with event name
    await expect(
      page.getByRole('heading', { name: /manage guests.*swamp ceremony/i })
    ).toBeVisible()
    await expect(page.getByText(/does not send invitations/i)).toBeVisible()
  })

  test('should display guest list with checkboxes in dialog', async ({ page }) => {
    // Open Manage Guests for "Morning-After Breakfast"
    const manageGuestsButton = page
      .locator('div')
      .filter({ hasText: /morning-after breakfast/i })
      .getByRole('button', { name: /manage guests/i })
      .first()

    await manageGuestsButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Should show guest names from seed data
    await expect(dialog.getByText(/donkey/i).first()).toBeVisible()

    // Should show invite count
    await expect(dialog.getByText(/guests invited/i)).toBeVisible()

    // Should have Invite All and Uninvite All buttons
    await expect(dialog.getByRole('button', { name: /invite all/i })).toBeVisible()
    await expect(dialog.getByRole('button', { name: /uninvite all/i })).toBeVisible()
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

    // Search for a specific guest
    await dialog.getByPlaceholder(/search guests/i).fill('Donkey')

    // Should show Donkey but filter out others
    await expect(dialog.getByText('Donkey The Donkey')).toBeVisible()

    // Clear search
    await dialog.getByPlaceholder(/search guests/i).fill('')
  })

  test('should add a guest to an event and then remove them', async ({ page }) => {
    // Open Manage Guests for "Morning-After Breakfast"
    // Seed data: Big Bad Wolf is "Not Invited" to this event
    const manageGuestsButton = page
      .locator('div')
      .filter({ hasText: /morning-after breakfast/i })
      .getByRole('button', { name: /manage guests/i })
      .first()

    await manageGuestsButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Search for Big Bad Wolf to isolate them
    await dialog.getByPlaceholder(/search guests/i).fill('Big Bad')

    // Find the checkbox label for Big Bad Wolf and click it to invite
    const wolfLabel = dialog.locator('label').filter({ hasText: /big bad wolf/i })
    await expect(wolfLabel).toBeVisible()

    // The checkbox should be unchecked (Not Invited)
    const wolfCheckbox = wolfLabel.locator('[role="checkbox"]')
    await expect(wolfCheckbox).not.toBeChecked()

    // Click to invite
    await wolfCheckbox.click()
    await expect(wolfCheckbox).toBeChecked()

    // Save button should show 1 change
    const saveButton = dialog.getByRole('button', { name: /save.*1 change/i })
    await expect(saveButton).toBeVisible()
    await saveButton.click()

    // Dialog should close and show success toast
    await expect(dialog).not.toBeVisible()
    await expect(page.getByText(/guest list updated/i)).toBeVisible()

    // --- Now reopen and remove the guest ---
    await manageGuestsButton.click()
    await expect(dialog).toBeVisible()

    // Search for Big Bad Wolf again
    await dialog.getByPlaceholder(/search guests/i).fill('Big Bad')

    const wolfLabelAgain = dialog.locator('label').filter({ hasText: /big bad wolf/i })
    const wolfCheckboxAgain = wolfLabelAgain.locator('[role="checkbox"]')

    // Should now be checked (Invited)
    await expect(wolfCheckboxAgain).toBeChecked()

    // Click to uninvite
    await wolfCheckboxAgain.click()
    await expect(wolfCheckboxAgain).not.toBeChecked()

    // Save the removal
    const saveButton2 = dialog.getByRole('button', { name: /save.*1 change/i })
    await expect(saveButton2).toBeVisible()
    await saveButton2.click()

    // Dialog should close and show success toast
    await expect(dialog).not.toBeVisible()
    await expect(page.getByText(/guest list updated/i)).toBeVisible()
  })

  test('should invite all guests and then uninvite all', async ({ page }) => {
    // Open Manage Guests for "Morning-After Breakfast"
    const manageGuestsButton = page
      .locator('div')
      .filter({ hasText: /morning-after breakfast/i })
      .getByRole('button', { name: /manage guests/i })
      .first()

    await manageGuestsButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Note the initial invited count
    const countText = dialog.getByText(/\d+ of \d+ guests invited/i)
    await expect(countText).toBeVisible()

    // Click "Invite All"
    await dialog.getByRole('button', { name: /invite all/i }).click()

    // Save changes
    const saveButton = dialog.getByRole('button', { name: /save/i }).last()
    await expect(saveButton).toBeEnabled()
    await saveButton.click()

    await expect(dialog).not.toBeVisible()
    await expect(page.getByText(/guest list updated/i)).toBeVisible()

    // Reopen dialog and click "Uninvite All" to restore state
    await manageGuestsButton.click()
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: /uninvite all/i }).click()

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

    // Click cancel
    await dialog.getByRole('button', { name: /cancel/i }).click()

    // Dialog should close
    await expect(dialog).not.toBeVisible()
  })
})
