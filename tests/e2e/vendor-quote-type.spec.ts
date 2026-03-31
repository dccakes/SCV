import { expect, test } from '@playwright/test'

test.describe
  .serial('Vendor Quote Type', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/vendors')
    })

    test('should display "flat fee" label on existing seeded quotes', async ({ page }) => {
      // Open Dragonfire Catering (has 2 quotes in seed data)
      await page.getByRole('button', { name: /view dragonfire catering details/i }).click()

      // Seeded quotes default to FLAT_FEE, so we should see "flat fee" labels
      await expect(page.getByText('flat fee').first()).toBeVisible()
    })

    test('should show quote type dropdown in new quote form', async ({ page }) => {
      // Open a vendor detail panel
      await page.getByRole('button', { name: /view dragonfire catering details/i }).click()

      // Click "+ Add Quote"
      await page.getByText('+ Add Quote').click()

      // The Quote Type dropdown should be visible
      await expect(page.getByText('Quote Type')).toBeVisible()

      // Default value should be "Flat Fee"
      await expect(page.getByRole('combobox').filter({ hasText: 'Flat Fee' })).toBeVisible()
    })

    test('should allow selecting "Per Guest" quote type', async ({ page }) => {
      await page.getByRole('button', { name: /view dragonfire catering details/i }).click()
      await page.getByText('+ Add Quote').click()

      // Open the quote type dropdown and select "Per Guest"
      await page.getByRole('combobox').filter({ hasText: 'Flat Fee' }).click()
      await page.getByRole('option', { name: 'Per Guest' }).click()

      // The dropdown should now show "Per Guest"
      await expect(page.getByRole('combobox').filter({ hasText: 'Per Guest' })).toBeVisible()
    })

    test('should save a new quote with "Per Guest" type and display "/ guest" label', async ({
      page,
    }) => {
      await page.getByRole('button', { name: /view dragonfire catering details/i }).click()
      await page.getByText('+ Add Quote').click()

      // Fill in quote details
      await page.locator('#quote-price').fill('75')
      await page.locator('#quote-date').fill('2026-03-15')

      // Select "Per Guest" quote type
      await page.getByRole('combobox').filter({ hasText: 'Flat Fee' }).click()
      await page.getByRole('option', { name: 'Per Guest' }).click()

      // Submit the form
      await page.getByRole('button', { name: 'Add Quote' }).click()

      // Wait for the quote to appear with "/ guest" label
      await expect(page.getByText('/ guest').first()).toBeVisible()

      // Verify the price appears in the quote detail (scoped to the quotes section)
      await expect(page.getByText('$75.00')).toBeVisible()
    })

    test('should save a new quote with default "Flat Fee" type', async ({ page }) => {
      await page.getByRole('button', { name: /view dragonfire catering details/i }).click()

      // Count existing quotes
      const initialQuoteCount = await page.getByText('flat fee').count()

      await page.getByText('+ Add Quote').click()

      // Fill in quote details (leave quote type as default "Flat Fee")
      await page.locator('#quote-price').fill('3500')
      await page.locator('#quote-date').fill('2026-03-15')

      // Submit the form
      await page.getByRole('button', { name: 'Add Quote' }).click()

      // Should see one more "flat fee" label than before
      await expect(page.getByText('flat fee')).toHaveCount(initialQuoteCount + 1)
    })

    test('should show quote type dropdown when editing an existing quote', async ({ page }) => {
      await page.getByRole('button', { name: /view dragonfire catering details/i }).click()

      // Dragonfire Catering seed quote: "Standard buffet" at $4,200
      // Find the quote card containing "Standard buffet" and click its Edit button.
      // The notes <p> is nested: card > flex-div > left-div > <p>Standard buffet</p>
      // Walk up from the notes text to the flex container that holds the Edit button.
      const editBtn = page
        .getByText('Standard buffet')
        .locator('xpath=ancestor::div[contains(@class,"flex items-start")]')
        .getByRole('button', { name: 'Edit' })
      await editBtn.click()

      // The edit form should show the Quote Type dropdown
      await expect(page.getByText('Quote Type')).toBeVisible()

      // Seeded quotes default to FLAT_FEE
      await expect(page.getByRole('combobox').filter({ hasText: 'Flat Fee' })).toBeVisible()
    })

    test('should update quote type from flat fee to per guest', async ({ page }) => {
      await page.getByRole('button', { name: /view dragonfire catering details/i }).click()

      // Find the "Standard buffet" quote's Edit button via xpath ancestor
      const editBtn = page
        .getByText('Standard buffet')
        .locator('xpath=ancestor::div[contains(@class,"flex items-start")]')
        .getByRole('button', { name: 'Edit' })
      await editBtn.click()

      // Change quote type to "Per Guest" (click combobox regardless of current value for retry safety)
      await page.getByRole('combobox').click()
      await page.getByRole('option', { name: 'Per Guest' }).click()

      // Save changes
      await page.getByRole('button', { name: 'Save Changes' }).click()

      // The edited quote should now show "/ guest" instead of "flat fee"
      await expect(page.getByText('/ guest').first()).toBeVisible()
    })
  })
