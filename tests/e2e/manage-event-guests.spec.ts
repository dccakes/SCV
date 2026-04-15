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
    await expect(dialog.locator('label').filter({ hasText: /donkey/i })).toBeVisible()

    await expect(dialog.getByText(/donkey/i).first()).toBeVisible()
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

  test('should toggle a guest invitation on and off', async ({ page }) => {
    const manageGuestsButton = page
      .locator('div')
      .filter({ hasText: /morning-after breakfast/i })
      .getByRole('button', { name: /manage guests/i })
      .first()

    // --- Step 1: Ensure Wolf starts as NOT invited ---
    await manageGuestsButton.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('label').filter({ hasText: /donkey/i })).toBeVisible()

    await dialog.getByPlaceholder(/search guests/i).fill('Wolf')
    const wolfLabel = dialog.locator('label').filter({ hasText: /big bad wolf/i })
    await expect(wolfLabel).toBeVisible()
    const wolfCheckbox = wolfLabel.locator('[role="checkbox"]')

    // If Wolf is already invited (stale DB from a previous run), uninvite first
    if (await wolfCheckbox.isChecked()) {
      await wolfCheckbox.click()
      await dialog.getByRole('button', { name: /save/i }).last().click()
      await expect(dialog).not.toBeVisible()

      // Reopen
      await manageGuestsButton.click()
      await expect(dialog).toBeVisible()
      await expect(dialog.locator('label').filter({ hasText: /donkey/i })).toBeVisible()
      await dialog.getByPlaceholder(/search guests/i).fill('Wolf')
      await expect(wolfLabel).toBeVisible()
    }

    // --- Step 2: Invite Wolf ---
    await expect(wolfCheckbox).not.toBeChecked()
    await wolfCheckbox.click()
    await expect(wolfCheckbox).toBeChecked()

    const saveButton = dialog.getByRole('button', { name: /save.*1 change/i })
    await expect(saveButton).toBeVisible()
    await saveButton.click()

    await expect(dialog).not.toBeVisible()
    await expect(page.getByText(/guest list updated/i).first()).toBeVisible()

    // --- Step 3: Reopen and verify Wolf is invited, then uninvite ---
    await manageGuestsButton.click()
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('label').filter({ hasText: /donkey/i })).toBeVisible()
    await dialog.getByPlaceholder(/search guests/i).fill('Wolf')

    const wolfCheckbox2 = dialog
      .locator('label')
      .filter({ hasText: /big bad wolf/i })
      .locator('[role="checkbox"]')
    await expect(wolfCheckbox2).toBeChecked()

    await wolfCheckbox2.click()
    await expect(wolfCheckbox2).not.toBeChecked()

    const saveButton2 = dialog.getByRole('button', { name: /save.*1 change/i })
    await expect(saveButton2).toBeVisible()
    await saveButton2.click()

    await expect(dialog).not.toBeVisible()
    await expect(page.getByText(/guest list updated/i).first()).toBeVisible()
  })

  test('should bulk invite all guests', async ({ page }) => {
    const manageGuestsButton = page
      .locator('div')
      .filter({ hasText: /morning-after breakfast/i })
      .getByRole('button', { name: /manage guests/i })
      .first()

    // Step 1: Uninvite all to ensure a clean baseline
    await manageGuestsButton.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('label').filter({ hasText: /donkey/i })).toBeVisible()

    await dialog.getByRole('button', { name: 'Uninvite All', exact: true }).click()

    // Save if there are changes, otherwise close
    const uninviteSave = dialog.getByRole('button', { name: /save/i }).last()
    if (await uninviteSave.isEnabled()) {
      await uninviteSave.click()
      await expect(dialog).not.toBeVisible()
    } else {
      await dialog.getByRole('button', { name: /cancel/i }).click()
      await expect(dialog).not.toBeVisible()
    }

    // Step 2: Reopen and invite all — now there must be changes
    await manageGuestsButton.click()
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('label').filter({ hasText: /donkey/i })).toBeVisible()

    await dialog.getByRole('button', { name: 'Invite All', exact: true }).click()

    const saveButton = dialog.getByRole('button', { name: /save/i }).last()
    await expect(saveButton).toBeEnabled()
    await saveButton.click()

    await expect(dialog).not.toBeVisible()
    await expect(page.getByText(/guest list updated/i).first()).toBeVisible()

    // Step 3: Restore — uninvite all
    await manageGuestsButton.click()
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('label').filter({ hasText: /donkey/i })).toBeVisible()

    await dialog.getByRole('button', { name: 'Uninvite All', exact: true }).click()

    const restoreSave = dialog.getByRole('button', { name: /save/i }).last()
    await expect(restoreSave).toBeEnabled()
    await restoreSave.click()

    await expect(dialog).not.toBeVisible()
    await expect(page.getByText(/guest list updated/i).first()).toBeVisible()
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
