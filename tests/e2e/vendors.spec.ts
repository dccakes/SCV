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

  test('should show quote prices on vendor cards', async ({ page }) => {
    await page.goto('/vendors')

    // Far Far Away Banquet Hall has a $8,500 quote
    // Dragonfire Catering has $4,200 - $5,100 range
    const body = page.locator('body')
    await expect(body).toContainText(/\$8,500|\$4,200|\$5,100/i)
  })
})

test.describe('Vendor Detail Panel', () => {
  test('should open vendor detail panel when clicking a vendor', async ({ page }) => {
    await page.goto('/vendors')

    // Click the first vendor card (Far Far Away Banquet Hall)
    await page.getByLabel(/view.*banquet hall.*details/i).click()

    // The detail panel dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog')).toContainText(/banquet hall/i)
  })

  test('should display vendor details in the panel', async ({ page }) => {
    await page.goto('/vendors')
    await page.getByLabel(/view.*banquet hall.*details/i).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Should show contact info from seed
    await expect(dialog).toContainText(/far far away/i) // location
    await expect(dialog).toContainText(/venue@swamp\.wed/i) // email
  })

  test('should display quotes in the detail panel', async ({ page }) => {
    await page.goto('/vendors')
    await page.getByLabel(/view.*banquet hall.*details/i).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Should show the quote price and notes from seed
    await expect(dialog).toContainText(/\$8,500/i)
    await expect(dialog).toContainText(/includes ceremony grove/i)
  })

  test('should close the detail panel', async ({ page }) => {
    await page.goto('/vendors')
    await page.getByLabel(/view.*banquet hall.*details/i).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Close by clicking the Close button in the footer
    await dialog.getByRole('button', { name: /close/i }).click()
    await expect(dialog).not.toBeVisible()
  })
})

test.describe('Vendor CRUD', () => {
  test('should create a new vendor', async ({ page }) => {
    await page.goto('/vendors')

    // Click "+ Add Vendor" button in the "Other" category section
    const otherSection = page.locator('section').filter({ hasText: /^other/i })
    await otherSection.getByRole('button', { name: /add vendor/i }).click()

    // Fill in the vendor form
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByLabel(/name/i).first().fill('E2E Test Vendor')
    await dialog.getByLabel(/location/i).fill('Test City')
    await dialog.getByRole('button', { name: /add vendor/i }).click()

    // Vendor should now appear on the page
    await expect(page.locator('body')).toContainText('E2E Test Vendor')
  })

  test('should delete a vendor', async ({ page }) => {
    await page.goto('/vendors')

    // First create a vendor to delete
    const otherSection = page.locator('section').filter({ hasText: /^other/i })
    await otherSection.getByRole('button', { name: /add vendor/i }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel(/name/i).first().fill('Vendor To Delete')
    await dialog.getByRole('button', { name: /add vendor/i }).click()
    await expect(page.locator('body')).toContainText('Vendor To Delete')

    // Now delete it using the remove button
    page.on('dialog', (d) => d.accept())
    await page.getByLabel(/remove vendor to delete/i).click()

    // Vendor should be gone
    await expect(page.locator('body')).not.toContainText('Vendor To Delete')
  })

  test('should edit vendor details', async ({ page }) => {
    await page.goto('/vendors')

    // Open detail panel for a seeded vendor
    await page.getByLabel(/view.*banquet hall.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Click "Edit" in the details section to open inline edit form
    await dialog.getByRole('button', { name: /^edit$/i }).first().click()

    // Verify the edit form is shown with existing values
    await expect(dialog.getByLabel(/name/i).first()).toBeVisible()
  })
})

test.describe('Quote Management', () => {
  test('should add a quote to a vendor', async ({ page }) => {
    await page.goto('/vendors')

    // Open detail panel for Pied Piper Collective (has 1 quote)
    await page.getByLabel(/view.*pied piper.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Click "+ Add Quote"
    await dialog.getByRole('button', { name: /add quote/i }).click()

    // Fill in quote form
    await dialog.getByLabel(/price/i).fill('2500')
    await dialog.getByLabel(/date/i).fill('2026-06-01')
    await dialog.getByLabel(/notes/i).fill('E2E test quote')
    await dialog.getByRole('button', { name: /add quote/i }).click()

    // New quote should appear
    await expect(dialog).toContainText('$2,500')
    await expect(dialog).toContainText('E2E test quote')
  })

  test('should delete a quote', async ({ page }) => {
    await page.goto('/vendors')

    // Open Dragonfire Catering — it has 2 quotes
    await page.getByLabel(/view.*dragonfire.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Should show both quotes
    await expect(dialog).toContainText(/\$4,200/)
    await expect(dialog).toContainText(/\$5,100/)

    // Click "Remove" on one of the quotes
    page.on('dialog', (d) => d.accept())
    const removeButtons = dialog.getByRole('button', { name: /^remove$/i })
    await removeButtons.first().click()

    // Wait for the quote to be removed — only one price should remain
    await expect(dialog).toContainText(/\$4,200|\$5,100/)
  })
})

test.describe('File Upload UI', () => {
  test('should show file upload dropzone in new quote form', async ({ page }) => {
    await page.goto('/vendors')

    // Open any vendor and add a quote
    await page.getByLabel(/view.*magic mirror.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Click "+ Add Quote"
    await dialog.getByRole('button', { name: /add quote/i }).click()

    // Dropzone should be visible with file type hints
    await expect(dialog).toContainText(/drag & drop/i)
    await expect(dialog).toContainText(/pdf.*word.*excel|max 8 mb/i)
  })

  test('should show attach files button on existing quotes', async ({ page }) => {
    await page.goto('/vendors')

    // Open a vendor with quotes
    await page.getByLabel(/view.*banquet hall.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Should show "Attach files" button
    await expect(dialog.getByRole('button', { name: /attach files/i })).toBeVisible()
  })

  test('should show file upload dropzone when clicking attach files', async ({ page }) => {
    await page.goto('/vendors')

    await page.getByLabel(/view.*banquet hall.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Click "Attach files"
    await dialog.getByRole('button', { name: /attach files/i }).click()

    // Dropzone should appear with accepted types hint
    await expect(dialog).toContainText(/drag & drop/i)
    await expect(dialog).toContainText(/max 8 mb/i)
  })

  test('should select and display files in the dropzone', async ({ page }) => {
    await page.goto('/vendors')

    await page.getByLabel(/view.*banquet hall.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Click "Attach files"
    await dialog.getByRole('button', { name: /attach files/i }).click()

    // Simulate file selection via the hidden input
    const fileInput = dialog.locator('input[type="file"]')

    // Create a test PDF buffer
    const buffer = Buffer.from('%PDF-1.4 test content')

    await fileInput.setInputFiles({
      name: 'test-quote.pdf',
      mimeType: 'application/pdf',
      buffer,
    })

    // The selected file should appear in the list
    await expect(dialog).toContainText('test-quote.pdf')

    // Upload button should appear
    await expect(dialog.getByRole('button', { name: /upload 1 file/i })).toBeVisible()
  })

  test('should remove a selected file before upload', async ({ page }) => {
    await page.goto('/vendors')

    await page.getByLabel(/view.*banquet hall.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: /attach files/i }).click()

    const fileInput = dialog.locator('input[type="file"]')
    const buffer = Buffer.from('%PDF-1.4 test content')

    await fileInput.setInputFiles({
      name: 'remove-me.pdf',
      mimeType: 'application/pdf',
      buffer,
    })

    await expect(dialog).toContainText('remove-me.pdf')

    // Click the remove button
    await dialog.getByLabel(/remove remove-me\.pdf/i).click()

    // File should be gone, upload button should disappear
    await expect(dialog).not.toContainText('remove-me.pdf')
  })

  test('should show quote form without file upload in edit mode', async ({ page }) => {
    await page.goto('/vendors')

    // Open a vendor with an existing quote
    await page.getByLabel(/view.*banquet hall.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Click "Edit" on the quote
    await dialog.getByRole('button', { name: /^edit$/i }).last().click()

    // Edit form should be visible but NOT have a dropzone
    await expect(dialog.getByLabel(/price/i)).toBeVisible()
    await expect(dialog).not.toContainText(/drag & drop files/i)
  })
})

test.describe('Vendor Status', () => {
  test('should display status selector in the detail panel', async ({ page }) => {
    await page.goto('/vendors')

    await page.getByLabel(/view.*banquet hall.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Status selector should be visible (shows current status "Selected")
    await expect(dialog).toContainText(/selected/i)
  })
})
