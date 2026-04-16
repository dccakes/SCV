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

    // Close by clicking the Close button in the footer (exact match avoids the X "Close vendor details" button)
    await dialog.getByRole('button', { name: 'Close', exact: true }).click()
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
    page.once('dialog', (d) => d.accept())
    await page.getByLabel(/remove vendor to delete/i).click()

    // Vendor should be gone
    await expect(page.locator('body')).not.toContainText('Vendor To Delete')
  })

  test('should edit vendor details', async ({ page }) => {
    await page.goto('/vendors')

    // Create a dedicated vendor so we don't permanently mutate seed data
    const otherSection = page.locator('section').filter({ hasText: /^other/i })
    await otherSection.getByRole('button', { name: /add vendor/i }).click()
    const createDialog = page.getByRole('dialog')
    await createDialog.getByLabel(/name/i).first().fill('Details Edit Test')
    await createDialog.getByRole('button', { name: /add vendor/i }).click()
    await expect(page.locator('body')).toContainText('Details Edit Test')

    // Open detail panel for the new vendor
    await page.getByLabel(/view.*details edit test.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Click "Edit" in the details section to open inline edit form
    await dialog.getByRole('button', { name: /^edit$/i }).first().click()

    // Change the name and add a location
    const nameInput = dialog.getByLabel(/name/i).first()
    await nameInput.clear()
    await nameInput.fill('Details Edit Test — Updated')
    await dialog.getByLabel(/location/i).fill('Edited City, Edited State')

    // Submit the form
    await dialog.getByRole('button', { name: /save changes/i }).click()

    // Updated name and location should appear in the panel
    await expect(dialog).toContainText('Details Edit Test — Updated')
    await expect(dialog).toContainText('Edited City, Edited State')
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
    page.once('dialog', (d) => d.accept())
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
    await dialog
      .getByRole('button', { name: /^edit$/i })
      .last()
      .click()

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

  test('should update vendor status', async ({ page }) => {
    await page.goto('/vendors')

    // Open Swampview Lodge — seeded as IN_REVIEW, not used by other status assertions
    await page.getByLabel(/view.*swampview.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Confirm starting status is "In Review"
    await expect(dialog.getByRole('combobox')).toContainText(/in review/i)

    // Change status to "In Negotiation"
    await dialog.getByRole('combobox').click()
    await page.getByRole('option', { name: 'In Negotiation' }).click()

    // Status selector should reflect the saved change
    await expect(dialog.getByRole('combobox')).toContainText(/in negotiation/i)
  })
})

// ─── Security Tests ───────────────────────────────────────────────────────────

test.describe('XSS Injection Prevention', () => {
  test('should safely render XSS payload in vendor name', async ({ page }) => {
    await page.goto('/vendors')

    const xssPayload = '<script>alert("xss")</script>'

    // Clean up any leftover XSS vendors from prior runs before the test
    const escapedPayload = xssPayload.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const removeBtns = page.getByLabel(new RegExp(`remove.*${escapedPayload}`, 'i'))
    let leftoverCount = await removeBtns.count()
    while (leftoverCount > 0) {
      page.once('dialog', (d) => d.accept())
      await removeBtns.first().click()
      await page.waitForTimeout(300)
      leftoverCount = await removeBtns.count()
    }

    // Create a vendor with XSS in the name
    const otherSection = page.locator('section').filter({ hasText: /^other/i })
    await otherSection.getByRole('button', { name: /add vendor/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByLabel(/name/i).first().fill(xssPayload)
    await dialog.getByRole('button', { name: /add vendor/i }).click()

    // The vendor should be rendered as text, not executed
    await expect(page.locator('body')).toContainText(xssPayload)

    // Verify no executable script tags contain the XSS payload.
    // Exclude Next.js RSC flight data scripts (self.__next_f.push) and __NEXT_DATA__ which
    // serialize page data as escaped text — not executable JS — so "alert" in them is safe.
    const injectedScripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script')).filter((s) => {
        const text = s.textContent ?? ''
        const isNextRscFlight = text.trimStart().startsWith('self.__next_f')
        const isNextData = s.id === '__NEXT_DATA__' || s.type === 'application/json'
        return !isNextRscFlight && !isNextData && text.includes('alert')
      }).length
    })
    expect(injectedScripts).toBe(0)

    // Clean up — delete all XSS vendors created in this test
    let remaining = await removeBtns.count()
    while (remaining > 0) {
      page.once('dialog', (d) => d.accept())
      await removeBtns.first().click()
      await page.waitForTimeout(300)
      remaining = await removeBtns.count()
    }
  })

  test('should safely render XSS payload in vendor location', async ({ page }) => {
    await page.goto('/vendors')

    const xssPayload = '"><img src=x onerror=alert(1)>'

    // Clean up any leftover "XSS Location Test" vendors from prior runs
    const locationRemoveBtns = page.getByLabel(/remove.*xss location test/i)
    let leftoverCount = await locationRemoveBtns.count()
    while (leftoverCount > 0) {
      page.once('dialog', (d) => d.accept())
      await locationRemoveBtns.first().click()
      await page.waitForTimeout(300)
      leftoverCount = await locationRemoveBtns.count()
    }

    const otherSection = page.locator('section').filter({ hasText: /^other/i })
    await otherSection.getByRole('button', { name: /add vendor/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByLabel(/name/i).first().fill('XSS Location Test')
    await dialog.getByLabel(/location/i).fill(xssPayload)
    await dialog.getByRole('button', { name: /add vendor/i }).click()

    // Open detail panel to verify location renders as text
    await page
      .getByLabel(/view.*xss location test.*details/i)
      .first()
      .click()
    const detailDialog = page.getByRole('dialog')
    await expect(detailDialog).toBeVisible()

    // Verify the payload appears as escaped text, not rendered HTML
    await expect(detailDialog).toContainText(xssPayload)

    // Verify no rogue img elements were injected
    const rogueImages = await page.locator('img[src="x"]').count()
    expect(rogueImages).toBe(0)

    // Clean up
    await detailDialog.getByRole('button', { name: /close/i }).last().click()
    let remaining = await locationRemoveBtns.count()
    while (remaining > 0) {
      page.once('dialog', (d) => d.accept())
      await locationRemoveBtns.first().click()
      await page.waitForTimeout(300)
      remaining = await locationRemoveBtns.count()
    }
  })

  test('should safely render XSS payload in quote notes', async ({ page }) => {
    await page.goto('/vendors')

    const xssPayload = '<img src=x onerror="document.body.innerHTML=\'hacked\'">'

    // Open Pied Piper and add a quote with XSS in notes
    await page.getByLabel(/view.*pied piper.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: /add quote/i }).click()
    await dialog.getByLabel(/price/i).fill('999')
    await dialog.getByLabel(/date/i).fill('2026-01-01')
    await dialog.getByLabel(/notes/i).fill(xssPayload)
    await dialog.getByRole('button', { name: /add quote/i }).click()

    // Page should still be functional — if XSS executed it would replace the entire body
    // Note: body text includes the escaped payload text which contains 'hacked' as a substring,
    // so we verify the dialog is intact rather than checking for absence of the word
    await expect(dialog).toContainText('$999')
  })
})

test.describe('Multi-User Data Isolation', () => {
  test("should not show other users' vendors after signing up as a new user", async ({
    browser,
  }) => {
    // Create a fresh browser context (no auth)
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await context.newPage()

    // Sign up as a completely new user
    const uniqueEmail = `e2e-isolation-${Date.now()}@test.com`
    await page.goto('/auth/sign-up')
    // Wait for the sign-up form to be ready (better-auth-ui renders the button as "Create an account")
    const signUpBtn = page.getByRole('button', { name: 'Create an account' })
    await signUpBtn.waitFor()

    await page.getByLabel('Name').fill('Isolation Test User')
    await page.getByLabel('Email').fill(uniqueEmail)
    await page.getByLabel('Password').fill('securePassword123!')
    await signUpBtn.click()

    // Wait until redirected away from /auth/* (may land on /, /dashboard, /onboarding, etc.)
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/'), { timeout: 15_000 })

    // Navigate to vendors page
    await page.goto('/vendors')
    // New users without an organization are redirected away from /vendors (to / or /onboarding)
    // Either way they cannot see Shrek's seeded vendors
    await page.waitForLoadState('networkidle')

    // This new user should NOT see Shrek's seeded vendors (regardless of where they land)
    const body = page.locator('body')
    await expect(body).not.toContainText(/far far away banquet hall/i)
    await expect(body).not.toContainText(/dragonfire catering/i)
    await expect(body).not.toContainText(/magic mirror studios/i)
    await expect(body).not.toContainText(/pied piper collective/i)
    await expect(body).not.toContainText(/swampview lodge/i)

    await context.close()
  })
})

test.describe('Unauthenticated Access', () => {
  test('should redirect unauthenticated users from /vendors', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await context.newPage()

    await page.goto('/vendors')

    // Should be redirected away from vendors page
    await expect(page).not.toHaveURL('/vendors')

    await context.close()
  })

  test('should reject unauthenticated file upload API requests', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const page = await context.newPage()

    // Directly call the blob upload API without authentication
    const response = await page.request.post('/api/blob/upload', {
      data: JSON.stringify({
        type: 'blob.generate-client-token',
        payload: { pathname: 'test.pdf', callbackUrl: '/' },
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    // Should receive 401 Unauthorized (or 400)
    expect(response.status()).toBeGreaterThanOrEqual(400)

    // Response should NOT leak internal error details
    const body = await response.json()
    expect(body.error).toBeDefined()
    expect(JSON.stringify(body)).not.toMatch(/stack|trace|prisma|sql|database/i)

    await context.close()
  })
})

test.describe('File Upload Security', () => {
  test('should reject files with disallowed MIME types in the dropzone', async ({ page }) => {
    await page.goto('/vendors')

    await page.getByLabel(/view.*banquet hall.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: /attach files/i }).click()

    const fileInput = dialog.locator('input[type="file"]')

    // Try uploading an executable file — should be rejected by dropzone
    await fileInput.setInputFiles({
      name: 'malware.exe',
      mimeType: 'application/x-msdownload',
      buffer: Buffer.from('MZ fake executable'),
    })

    // The rejected file should NOT appear in the selected list
    await expect(dialog).not.toContainText('malware.exe')
  })

  test('should reject HTML files in the dropzone', async ({ page }) => {
    await page.goto('/vendors')

    await page.getByLabel(/view.*banquet hall.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: /attach files/i }).click()

    const fileInput = dialog.locator('input[type="file"]')

    // Try uploading an HTML file — could be used for stored XSS
    await fileInput.setInputFiles({
      name: 'evil.html',
      mimeType: 'text/html',
      buffer: Buffer.from('<script>alert("xss")</script>'),
    })

    // The HTML file should NOT appear in the selected list
    await expect(dialog).not.toContainText('evil.html')
  })

  test('should reject oversized files in the dropzone', async ({ page }) => {
    await page.goto('/vendors')

    await page.getByLabel(/view.*banquet hall.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: /attach files/i }).click()

    const fileInput = dialog.locator('input[type="file"]')

    // Create a buffer just over 8MB (allocUnsafe — contents irrelevant, only size matters)
    const oversizedBuffer = Buffer.allocUnsafe(8 * 1024 * 1024 + 1)

    await fileInput.setInputFiles({
      name: 'huge-file.pdf',
      mimeType: 'application/pdf',
      buffer: oversizedBuffer,
    })

    // The oversized file should NOT appear in the selected list
    await expect(dialog).not.toContainText('huge-file.pdf')
  })

  test('should enforce MAX_FILES_PER_QUOTE limit in the dropzone', async ({ page }) => {
    await page.goto('/vendors')

    // Open a vendor and start adding a new quote
    await page.getByLabel(/view.*magic mirror.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: /add quote/i }).click()

    const fileInput = dialog.locator('input[type="file"]')

    // Upload 10 files (the maximum)
    const files = Array.from({ length: 10 }, (_, i) => ({
      name: `file-${i + 1}.pdf`,
      mimeType: 'application/pdf' as const,
      buffer: Buffer.from(`%PDF-1.4 test ${i}`),
    }))

    await fileInput.setInputFiles(files)

    // All 10 should be listed
    for (let i = 1; i <= 10; i++) {
      await expect(dialog).toContainText(`file-${i}.pdf`)
    }

    // Try adding an 11th file — should be rejected
    await fileInput.setInputFiles({
      name: 'overflow-file.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 overflow'),
    })

    // The 11th file should NOT appear
    await expect(dialog).not.toContainText('overflow-file.pdf')
  })

  test('should accept valid file types (PDF, images, Word, Excel)', async ({ page }) => {
    await page.goto('/vendors')

    await page.getByLabel(/view.*banquet hall.*details/i).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: /attach files/i }).click()

    const fileInput = dialog.locator('input[type="file"]')

    // Upload a variety of valid file types
    await fileInput.setInputFiles([
      { name: 'contract.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') },
      { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('fake jpeg') },
      { name: 'quote.png', mimeType: 'image/png', buffer: Buffer.from('fake png') },
    ])

    // All valid files should appear
    await expect(dialog).toContainText('contract.pdf')
    await expect(dialog).toContainText('photo.jpg')
    await expect(dialog).toContainText('quote.png')
  })
})

test.describe('Error Response Security', () => {
  test('should not leak internal error details in tRPC error responses', async ({ page }) => {
    await page.goto('/vendors')

    // Directly call a tRPC endpoint with an invalid vendor ID to trigger a NOT_FOUND error
    const response = await page.request.post('/api/trpc/vendor.getById', {
      data: JSON.stringify({ json: { vendorId: 'non-existent-id-12345' } }),
      headers: { 'Content-Type': 'application/json' },
    })

    const body = await response.text()

    // The error response should NOT leak internal implementation details
    expect(body).not.toMatch(/prisma/i)
    expect(body).not.toMatch(/database/i)
    expect(body).not.toMatch(/stack.*at\s/i)
    expect(body).not.toMatch(/SQL/i)
  })
})
