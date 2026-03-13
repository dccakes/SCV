import { expect, test } from '@playwright/test'

test.describe('Manage Members Modal - Member Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
  })

  test('should display modal title and description', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    await expect(page.getByRole('heading', { name: /manage household members/i })).toBeVisible()
    await expect(
      page.getByText(/add, update, or remove people in this household before saving/i)
    ).toBeVisible()
  })

  test('should display all members of a 2-person household', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    await expect(page.getByLabel('First name (member 1)')).toHaveValue('Donkey')
    await expect(page.getByLabel('Last name (member 1)')).toHaveValue('The Donkey')
    await expect(page.getByLabel('First name (member 2)')).toHaveValue('Dragon')
    await expect(page.getByLabel('Last name (member 2)')).toHaveValue('The Dragon')
  })

  test('should display all members of a 3-person household (Three Bears)', async ({ page }) => {
    await page.getByRole('button', { name: /select papa.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    await expect(page.getByLabel('First name (member 1)')).toHaveValue('Papa')
    await expect(page.getByLabel('Last name (member 1)')).toHaveValue('Bear')
    await expect(page.getByLabel('First name (member 2)')).toHaveValue('Mama')
    await expect(page.getByLabel('Last name (member 2)')).toHaveValue('Bear')
    await expect(page.getByLabel('First name (member 3)')).toHaveValue('Baby')
    await expect(page.getByLabel('Last name (member 3)')).toHaveValue('Bear')
  })

  test('should display a single-member household', async ({ page }) => {
    await page.getByRole('button', { name: /select gingy.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    await expect(page.getByLabel('First name (member 1)')).toHaveValue('Gingy')
    await expect(page.getByLabel('Last name (member 1)')).toHaveValue('Cookie')
    // Should only have 1 member
    await expect(page.getByLabel('First name (member 2)')).not.toBeVisible()
  })

  test('should show action buttons for each member', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Each member should have Tag-along, Set primary, Tags, and Remove buttons
    await expect(
      page.getByRole('button', { name: /toggle tag-along for donkey the donkey/i })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /set donkey the donkey as primary/i })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /tags for donkey the donkey/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /remove donkey the donkey/i })).toBeVisible()
  })
})

test.describe('Manage Members Modal - Adding Members', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()
  })

  test('should add a new empty member row', async ({ page }) => {
    await page.getByRole('button', { name: /add guest/i }).click()

    await expect(page.getByLabel('First name (member 3)')).toBeVisible()
    await expect(page.getByLabel('Last name (member 3)')).toBeVisible()
    await expect(page.getByLabel('First name (member 3)')).toHaveValue('')
    await expect(page.getByLabel('Last name (member 3)')).toHaveValue('')
  })

  test('should add multiple new members', async ({ page }) => {
    await page.getByRole('button', { name: /add guest/i }).click()
    await page.getByRole('button', { name: /add guest/i }).click()

    await expect(page.getByLabel('First name (member 3)')).toBeVisible()
    await expect(page.getByLabel('First name (member 4)')).toBeVisible()
  })

  test('should allow filling in new member details', async ({ page }) => {
    await page.getByRole('button', { name: /add guest/i }).click()

    await page.getByLabel('First name (member 3)').fill('Puss')
    await page.getByLabel('Last name (member 3)').fill('In Boots')

    await expect(page.getByText('Puss In Boots')).toBeVisible()
  })
})

test.describe('Manage Members Modal - Removing Members', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
  })

  test('should remove a non-primary member', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Dragon is non-primary, should be removable
    await page.getByRole('button', { name: /remove dragon the dragon/i }).click()

    // Dragon's fields should disappear
    await expect(page.getByLabel('First name (member 2)')).not.toBeVisible()
    // Donkey should still be there
    await expect(page.getByLabel('First name (member 1)')).toHaveValue('Donkey')
  })

  test('should disable remove for the only primary contact', async ({ page }) => {
    await page.getByRole('button', { name: /select gingy.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Gingy is the only member and primary, remove should be disabled
    await expect(page.getByRole('button', { name: /remove gingy cookie/i })).toBeDisabled()
  })

  test('should allow removing a member from a 3-person household', async ({ page }) => {
    await page.getByRole('button', { name: /select papa.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Remove Baby Bear (non-primary)
    await page.getByRole('button', { name: /remove baby bear/i }).click()

    // Should now only have 2 members
    await expect(page.getByLabel('First name (member 3)')).not.toBeVisible()
    await expect(page.getByLabel('First name (member 1)')).toHaveValue('Papa')
    await expect(page.getByLabel('First name (member 2)')).toHaveValue('Mama')
  })
})

test.describe('Manage Members Modal - Set Primary', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()
  })

  test('should disable set primary for the current primary member', async ({ page }) => {
    // Donkey is already primary
    await expect(
      page.getByRole('button', { name: /set donkey the donkey as primary/i })
    ).toBeDisabled()
  })

  test('should enable set primary for non-primary members', async ({ page }) => {
    // Dragon is not primary, should be enabled
    await expect(
      page.getByRole('button', { name: /set dragon the dragon as primary/i })
    ).toBeEnabled()
  })

  test('should switch primary contact to another member', async ({ page }) => {
    // Set Dragon as primary
    await page.getByRole('button', { name: /set dragon the dragon as primary/i }).click()

    // Dragon should now be disabled (already primary)
    await expect(
      page.getByRole('button', { name: /set dragon the dragon as primary/i })
    ).toBeDisabled()

    // Donkey should now be enabled (no longer primary)
    await expect(
      page.getByRole('button', { name: /set donkey the donkey as primary/i })
    ).toBeEnabled()
  })
})

test.describe('Manage Members Modal - Tag-Along', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()
  })

  test('should toggle tag-along status on a non-primary member', async ({ page }) => {
    const tagAlongButton = page.getByRole('button', {
      name: /toggle tag-along for dragon the dragon/i,
    })
    await tagAlongButton.click()

    // After toggling on, set primary should be disabled for Dragon
    await expect(
      page.getByRole('button', { name: /set dragon the dragon as primary/i })
    ).toBeDisabled()
  })

  test('should toggle tag-along off after toggling on', async ({ page }) => {
    const tagAlongButton = page.getByRole('button', {
      name: /toggle tag-along for dragon the dragon/i,
    })

    // Toggle on
    await tagAlongButton.click()
    await expect(
      page.getByRole('button', { name: /set dragon the dragon as primary/i })
    ).toBeDisabled()

    // Toggle off
    await tagAlongButton.click()
    await expect(
      page.getByRole('button', { name: /set dragon the dragon as primary/i })
    ).toBeEnabled()
  })

  test('should prevent setting a tag-along member as primary', async ({ page }) => {
    // Toggle Dragon as tag-along
    await page.getByRole('button', { name: /toggle tag-along for dragon the dragon/i }).click()

    // Set primary should be disabled for tag-along Dragon
    await expect(
      page.getByRole('button', { name: /set dragon the dragon as primary/i })
    ).toBeDisabled()

    // Donkey's set primary should still be disabled (already primary)
    await expect(
      page.getByRole('button', { name: /set donkey the donkey as primary/i })
    ).toBeDisabled()
  })
})

test.describe('Manage Members Modal - Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()
  })

  test('should show validation error for empty names', async ({ page }) => {
    // Add an empty member
    await page.getByRole('button', { name: /add guest/i }).click()

    await expect(page.getByRole('button', { name: /save members/i })).toBeDisabled()
    await expect(page.getByText(/must include a first and last name/i)).toBeVisible()
  })

  test('should enable save when all members have names', async ({ page }) => {
    // All existing members have names, save should be enabled
    await expect(page.getByRole('button', { name: /save members/i })).toBeEnabled()
  })

  test('should show validation error when removing all non-tag-along members', async ({ page }) => {
    // Remove Dragon (non-primary)
    await page.getByRole('button', { name: /remove dragon the dragon/i }).click()

    // Toggle Donkey as tag-along (only member left)
    await page.getByRole('button', { name: /toggle tag-along for donkey the donkey/i }).click()

    await expect(page.getByRole('button', { name: /save members/i })).toBeDisabled()
    await expect(page.getByText(/at least one non-tag-along member/i)).toBeVisible()
  })

  test('should show validation error for no primary contact after changes', async ({ page }) => {
    // Set Dragon as primary
    await page.getByRole('button', { name: /set dragon the dragon as primary/i }).click()

    // Toggle Dragon as tag-along (this removes primary status)
    await page.getByRole('button', { name: /toggle tag-along for dragon the dragon/i }).click()

    // Now neither is primary
    await expect(page.getByRole('button', { name: /save members/i })).toBeDisabled()
    await expect(page.getByText(/choose exactly one primary/i)).toBeVisible()
  })
})

test.describe('Manage Members Modal - Cancel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()
  })

  test('should close modal on cancel without persisting changes', async ({ page }) => {
    // Make some changes
    await page.getByRole('button', { name: /add guest/i }).click()
    await expect(page.getByLabel('First name (member 3)')).toBeVisible()

    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Modal should close
    await expect(page.getByRole('heading', { name: /manage household members/i })).not.toBeVisible()

    // Re-open and verify no new member was persisted
    await page.getByRole('button', { name: /manage members/i }).click()
    await expect(page.getByLabel('First name (member 3)')).not.toBeVisible()
  })
})

test.describe('Manage Members Modal - Save', () => {
  test('should save new member and persist changes', async ({ page }) => {
    await page.goto('/guest-list')
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Add a new member
    await page.getByRole('button', { name: /add guest/i }).click()
    await page.getByLabel('First name (member 3)').fill('Dronkey')
    await page.getByLabel('Last name (member 3)').fill('Junior')

    // Set as non-primary (should already be non-primary by default)
    await page.getByRole('button', { name: /save members/i }).click()

    // Modal should close
    await expect(page.getByRole('heading', { name: /manage household members/i })).not.toBeVisible()

    // The party members list should now show the new member
    const membersList = page
      .locator('ul')
      .filter({ hasText: 'Donkey The Donkey' })
      .filter({ hasText: 'Dronkey Junior' })
    await expect(membersList.locator('span', { hasText: 'Dronkey Junior' })).toBeVisible()
  })

  test('should save member removal and persist changes', async ({ page }) => {
    await page.goto('/guest-list')

    // We need to use a household we haven't modified in other tests
    // Use Wolf & Pigs (Big Bad Wolf + Practical Pig)
    await page.getByRole('button', { name: /select big bad.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Check we have 2 members
    await expect(page.getByLabel('First name (member 2)')).toBeVisible()

    // Remove the second member
    await page.getByRole('button', { name: /remove practical pig/i }).click()

    await page.getByRole('button', { name: /save members/i }).click()

    // Modal should close
    await expect(page.getByRole('heading', { name: /manage household members/i })).not.toBeVisible()

    // Re-open to verify persistence
    await page.getByRole('button', { name: /manage members/i }).click()
    await expect(page.getByLabel('First name (member 2)')).not.toBeVisible()
  })
})
