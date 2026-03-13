import { expect, test } from '@playwright/test'

test.describe('Guest List - Search Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
  })

  test('should display the search input', async ({ page }) => {
    await expect(page.getByPlaceholder('Find guests')).toBeVisible()
  })

  test('should filter households by first name', async ({ page }) => {
    await page.getByPlaceholder('Find guests').fill('Donkey')

    // Donkey household should be visible
    await expect(page.getByRole('button', { name: /select donkey.*household/i })).toBeVisible()

    // Other households should not be visible
    await expect(page.getByRole('button', { name: /select gingy.*household/i })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /select papa.*household/i })).not.toBeVisible()
  })

  test('should filter households by last name', async ({ page }) => {
    await page.getByPlaceholder('Find guests').fill('Cookie')

    // Gingy Cookie's household should be visible
    await expect(page.getByRole('button', { name: /select gingy.*household/i })).toBeVisible()

    // Others should not be visible
    await expect(page.getByRole('button', { name: /select donkey.*household/i })).not.toBeVisible()
  })

  test('should filter by full name', async ({ page }) => {
    await page.getByPlaceholder('Find guests').fill('Fairy Godmother')

    await expect(
      page.getByRole('button', { name: /select fairy godmother.*household/i })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /select donkey.*household/i })).not.toBeVisible()
  })

  test('should be case-insensitive', async ({ page }) => {
    await page.getByPlaceholder('Find guests').fill('gingy')

    await expect(page.getByRole('button', { name: /select gingy.*household/i })).toBeVisible()
  })

  test('should show all households when search is cleared', async ({ page }) => {
    // Search for something
    await page.getByPlaceholder('Find guests').fill('Donkey')
    await expect(page.getByRole('button', { name: /select gingy.*household/i })).not.toBeVisible()

    // Clear search
    await page.getByPlaceholder('Find guests').fill('')

    // All households should be visible again
    await expect(page.getByRole('button', { name: /select donkey.*household/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /select gingy.*household/i })).toBeVisible()
  })

  test('should find household by non-primary member name', async ({ page }) => {
    // Dragon is non-primary in the Donkey household
    await page.getByPlaceholder('Find guests').fill('Dragon')

    await expect(page.getByRole('button', { name: /select donkey.*household/i })).toBeVisible()
  })

  test('should show no results for non-existent guest', async ({ page }) => {
    await page.getByPlaceholder('Find guests').fill('Nonexistent Name')

    // All known households should be hidden
    await expect(page.getByRole('button', { name: /select donkey.*household/i })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /select gingy.*household/i })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /select papa.*household/i })).not.toBeVisible()
  })
})

test.describe('Guest List - RSVP Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
  })

  test('should display the Filter By button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /filter by/i })).toBeVisible()
  })

  test('should open the RSVP filter dropdown', async ({ page }) => {
    await page.getByRole('button', { name: /filter by/i }).click()

    // Should show RSVP options
    await expect(page.getByText('Not Invited')).toBeVisible()
    await expect(page.getByText('Invited')).toBeVisible()
    await expect(page.getByText('Attending')).toBeVisible()
    await expect(page.getByText('Declined')).toBeVisible()
  })

  test('should show event names in the RSVP filter dropdown', async ({ page }) => {
    await page.getByRole('button', { name: /filter by/i }).click()

    // Seed events: Swamp Ceremony, Welcome Feast, Morning-After Breakfast
    await expect(page.getByText('Swamp Ceremony')).toBeVisible()
    await expect(page.getByText('Welcome Feast')).toBeVisible()
    await expect(page.getByText('Morning-After Breakfast')).toBeVisible()
  })

  test('should filter by Attending status', async ({ page }) => {
    await page.getByRole('button', { name: /filter by/i }).click()

    // Click "Attending" under any event section — we know Donkey is Attending for ceremony
    // The dropdown groups by event, click Attending under the first event
    const dropdown = page.locator('.absolute.top-full')
    await dropdown.getByText('Attending').first().click()

    // Donkey is attending ceremony, should be visible
    await expect(page.getByRole('button', { name: /select donkey.*household/i })).toBeVisible()
  })

  test('should filter by Declined status', async ({ page }) => {
    await page.getByRole('button', { name: /filter by/i }).click()

    // Click "Declined" under first event (Swamp Ceremony)
    // Practical Pig declined the ceremony
    const dropdown = page.locator('.absolute.top-full')
    await dropdown.getByText('Declined').first().click()

    // Wolf & Pigs household (Practical Pig declined ceremony)
    await expect(page.getByRole('button', { name: /select big bad.*household/i })).toBeVisible()

    // Donkey household (all attending ceremony) should not be visible
    await expect(page.getByRole('button', { name: /select donkey.*household/i })).not.toBeVisible()
  })

  test('should show Clear button when filter is active', async ({ page }) => {
    // No Clear button initially
    await expect(page.getByRole('button', { name: 'Clear' })).not.toBeVisible()

    // Apply a filter
    await page.getByRole('button', { name: /filter by/i }).click()
    const dropdown = page.locator('.absolute.top-full')
    await dropdown.getByText('Attending').first().click()

    // Clear button should appear
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible()
  })

  test('should clear the RSVP filter and show all households', async ({ page }) => {
    // Apply a filter
    await page.getByRole('button', { name: /filter by/i }).click()
    const dropdown = page.locator('.absolute.top-full')
    await dropdown.getByText('Declined').first().click()

    // Some households should be filtered out
    await expect(page.getByRole('button', { name: /select donkey.*household/i })).not.toBeVisible()

    // Clear the filter
    await page.getByRole('button', { name: 'Clear' }).click()

    // All households should be visible again
    await expect(page.getByRole('button', { name: /select donkey.*household/i })).toBeVisible()
  })

  test('should combine search and RSVP filter', async ({ page }) => {
    // Apply RSVP filter for Attending
    await page.getByRole('button', { name: /filter by/i }).click()
    const dropdown = page.locator('.absolute.top-full')
    await dropdown.getByText('Attending').first().click()

    // Now search for "Donkey"
    await page.getByPlaceholder('Find guests').fill('Donkey')

    // Donkey is attending and matches search
    await expect(page.getByRole('button', { name: /select donkey.*household/i })).toBeVisible()

    // Gingy is also attending ceremony but doesn't match search
    await expect(page.getByRole('button', { name: /select gingy.*household/i })).not.toBeVisible()
  })
})

test.describe('Guest List - Event Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
  })

  test('should display All Events tab', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'All Events' })).toBeVisible()
  })

  test('should display event-specific tabs from seed data', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Swamp Ceremony' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Welcome Feast' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Morning-After Breakfast' })).toBeVisible()
  })

  test('should switch to a specific event tab', async ({ page }) => {
    await page.getByRole('link', { name: 'Swamp Ceremony' }).click()

    // URL should update with event parameter
    await expect(page).toHaveURL(/event=/)

    // Guest cards should still be visible
    await expect(page.getByRole('button', { name: /select donkey.*household/i })).toBeVisible()
  })

  test('should show + New Event button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /\+ new event/i })).toBeVisible()
  })
})

test.describe('Guest List - Tag Display on Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
  })

  test('should display guest cards with RSVP badges', async ({ page }) => {
    // Donkey household: all attending across events
    const donkeyCard = page.getByRole('button', { name: /select donkey.*household/i })
    await expect(donkeyCard).toBeVisible()

    // Should show attending badge
    await expect(donkeyCard.getByText(/attending/i)).toBeVisible()
  })

  test('should display party size on guest cards', async ({ page }) => {
    // Donkey household has 2 guests
    const donkeyCard = page.getByRole('button', { name: /select donkey.*household/i })
    await expect(donkeyCard.getByText('Party of 2')).toBeVisible()

    // Three Bears household has 3 guests
    const bearsCard = page.getByRole('button', { name: /select papa.*household/i })
    await expect(bearsCard.getByText('Party of 3')).toBeVisible()

    // Gingy is solo
    const gingyCard = page.getByRole('button', { name: /select gingy.*household/i })
    await expect(gingyCard.getByText('Party of 1')).toBeVisible()
  })

  test('should display card with location info', async ({ page }) => {
    // Donkey household: Swampside, FFA, Far Far Away
    const donkeyCard = page.getByRole('button', { name: /select donkey.*household/i })
    await expect(donkeyCard.getByText(/Swampside/)).toBeVisible()
  })
})
