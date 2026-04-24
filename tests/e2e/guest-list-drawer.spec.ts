import { expect, test } from '@playwright/test'

test.describe('Guest List Drawer - Viewing Details', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
  })

  test('captures baseline time to open a household drawer', async ({ page }) => {
    const startedAt = Date.now()

    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await expect(page.getByRole('heading', { name: /donkey the donkey/i })).toBeVisible()

    const elapsedMs = Date.now() - startedAt
    test.info().annotations.push({
      type: 'baseline-timing',
      description: `guest-list-open-drawer-ms=${elapsedMs}`,
    })

    // Guardrail: this should remain comfortably interactive.
    expect(elapsedMs).toBeLessThan(15000)
  })

  test('should open the guest detail drawer when clicking a household card', async ({ page }) => {
    // Click the Donkey household card (primary contact: Donkey The Donkey)
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    // Drawer should open with the guest's name as the title
    await expect(page.getByRole('heading', { name: /donkey the donkey/i })).toBeVisible()
  })

  test('should display RSVP status in the drawer', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    // Donkey is "Attending" for all events, so we should see RSVP status
    await expect(page.getByRole('dialog').getByText('RSVP Status', { exact: true })).toBeVisible()
  })

  test('should display contact information for Donkey household', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    // Seed data: donkey@swamp.wed, +1-555-0101
    await expect(page.getByText('Contact & Address')).toBeVisible()
    await expect(page.getByText('donkey@swamp.wed')).toBeVisible()
    await expect(page.getByText('+1-555-0101')).toBeVisible()
    // Address: 1 Mud Lane, Swampside, FFA, 10001, Far Far Away
    await expect(page.getByText(/1 Mud Lane/)).toBeVisible()
  })

  test('should display party members with names and age groups', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    await expect(page.getByText('Party Members')).toBeVisible()

    // Donkey household has 2 members: Donkey (ADULT) and Dragon (ADULT)
    // Use locator scoped to the party members list to avoid strict mode violations
    // (name appears in card, drawer heading, AND member list)
    const membersList = page.locator('ul').filter({ hasText: 'Donkey The Donkey' })
    await expect(membersList.locator('span', { hasText: 'Donkey The Donkey' })).toBeVisible()
    await expect(membersList.locator('span', { hasText: 'Dragon The Dragon' })).toBeVisible()

    // Primary badge for Donkey
    await expect(page.getByText('Primary')).toBeVisible()
  })

  test('should show notes in the drawer', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    // Seed: "Needs high-chair seating for dragonlets."
    await expect(page.getByText('Notes')).toBeVisible()
    await expect(page.getByText(/Needs high-chair seating for dragonlets/i)).toBeVisible()
  })

  test('should display Seating & Event section', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    await expect(page.getByText('Seating & Event')).toBeVisible()
    // Should show the "Manage RSVPs in Events" link
    await expect(page.getByText(/Manage RSVPs in Events/i)).toBeVisible()
  })

  test('should display Communication Log section', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    await expect(page.getByText('Communication Log')).toBeVisible()
  })

  test('should close the drawer when clicking the close button', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    await expect(page.getByRole('heading', { name: /donkey the donkey/i })).toBeVisible()

    // Close the drawer
    await page.getByLabel('Close guest details').click()

    // Drawer title should no longer be visible
    await expect(page.getByRole('heading', { name: /donkey the donkey/i })).not.toBeVisible()
  })

  test('should show different details for different households', async ({ page }) => {
    // Open Gingy household
    await page.getByRole('button', { name: /select gingy.*household/i }).click()

    await expect(page.getByRole('heading', { name: /gingy cookie/i })).toBeVisible()
    // Gingy email: gingy@swamp.wed
    await expect(page.getByText('gingy@swamp.wed')).toBeVisible()
    // Gingy's address: 7 Cookie Crumble Ave, Far Far Away
    await expect(page.getByText(/Cookie Crumble Ave/)).toBeVisible()
  })

  test('should show household with multiple members (Three Bears)', async ({ page }) => {
    // Open the Three Bears household (Papa Bear is primary)
    await page.getByRole('button', { name: /select papa.*household/i }).click()

    // Should show all 3 members in the party members list
    const membersList = page
      .locator('ul')
      .filter({ hasText: 'Papa Bear' })
      .filter({ hasText: 'Mama Bear' })
    await expect(membersList.locator('span', { hasText: 'Papa Bear' })).toBeVisible()
    await expect(membersList.locator('span', { hasText: 'Mama Bear' })).toBeVisible()
    await expect(membersList.locator('span', { hasText: 'Baby Bear' })).toBeVisible()

    // Baby Bear is a CHILD
    await expect(membersList.getByText('child')).toBeVisible()
  })
})

test.describe('Guest List Drawer - Editing Contact & Address', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
  })

  test('should toggle contact address editing mode', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    // Click "Edit" on Contact & Address
    await page.getByLabel('Edit Contact & Address').click()

    // Should show input fields for email, phone, address
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="phone"]')).toBeVisible()
    await expect(page.locator('input[name="address1"]')).toBeVisible()
    await expect(page.locator('input[name="city"]')).toBeVisible()
    await expect(page.locator('input[name="state"]')).toBeVisible()
    await expect(page.locator('input[name="zipCode"]')).toBeVisible()
    await expect(page.locator('input[name="country"]')).toBeVisible()

    // "Done" button should now be visible
    await expect(page.getByRole('button', { name: 'Done' })).toBeVisible()
  })

  test('should pre-fill contact fields with existing data', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    await page.getByLabel('Edit Contact & Address').click()

    // Verify existing data is pre-filled
    await expect(page.locator('input[name="email"]')).toHaveValue('donkey@swamp.wed')
    await expect(page.locator('input[name="phone"]')).toHaveValue('+1-555-0101')
    await expect(page.locator('input[name="address1"]')).toHaveValue('1 Mud Lane')
    await expect(page.locator('input[name="city"]')).toHaveValue('Swampside')
    await expect(page.locator('input[name="state"]')).toHaveValue('FFA')
    await expect(page.locator('input[name="zipCode"]')).toHaveValue('10001')
    await expect(page.locator('input[name="country"]')).toHaveValue('Far Far Away')
  })

  test('should toggle notes editing mode', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    // Click "Edit" on Notes section
    await page.getByLabel('Edit Notes').click()

    // Textarea should appear with existing notes
    const notesTextarea = page.locator('textarea[name="notes"]')
    await expect(notesTextarea).toBeVisible()
    await expect(notesTextarea).toHaveValue('Needs high-chair seating for dragonlets.')
  })
})

test.describe('Guest List Drawer - Managing Members', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
  })

  test('should open the manage members modal', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    // Click "Manage members" button
    await page.getByRole('button', { name: /manage members/i }).click()

    // Modal should appear
    await expect(page.getByRole('heading', { name: /manage household members/i })).toBeVisible()
    await expect(
      page.getByText(/add, update, or remove people in this household before saving/i)
    ).toBeVisible()
  })

  test('should show existing members in the modal with correct names', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Should show both Donkey and Dragon
    await expect(page.getByLabel('First name (member 1)')).toHaveValue('Donkey')
    await expect(page.getByLabel('Last name (member 1)')).toHaveValue('The Donkey')
    await expect(page.getByLabel('First name (member 2)')).toHaveValue('Dragon')
    await expect(page.getByLabel('Last name (member 2)')).toHaveValue('The Dragon')
  })

  test('should add a new member to the household', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Click "Add guest" button
    await page.getByRole('button', { name: /add guest/i }).click()

    // A 3rd member row should appear with empty fields
    await expect(page.getByLabel('First name (member 3)')).toBeVisible()
    await expect(page.getByLabel('Last name (member 3)')).toBeVisible()

    // Fill in the new member
    await page.getByLabel('First name (member 3)').fill('Dronkey')
    await page.getByLabel('Last name (member 3)').fill('Junior')

    // The new member should be visible by name in the member card
    await expect(page.getByText('Dronkey Junior')).toBeVisible()
  })

  test('should show validation error when saving members with empty names', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Add a new member but leave names empty
    await page.getByRole('button', { name: /add guest/i }).click()

    // The "Save members" button should be disabled due to validation
    await expect(page.getByRole('button', { name: /save members/i })).toBeDisabled()

    // Should show a validation message
    await expect(page.getByText(/must include a first and last name/i)).toBeVisible()
  })

  test('should remove a member from the household', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Remove Dragon (member 2, non-primary)
    await page.getByRole('button', { name: /remove dragon the dragon/i }).click()

    // Dragon should no longer appear
    await expect(page.getByLabel('First name (member 2)')).not.toBeVisible()
  })

  test('should not allow removing the only primary member', async ({ page }) => {
    // Use Gingy household (single member, primary)
    await page.getByRole('button', { name: /select gingy.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // The Remove button should be disabled for the only primary member
    await expect(page.getByRole('button', { name: /remove gingy cookie/i })).toBeDisabled()
  })

  test('should toggle tag-along status for a member', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Toggle tag-along for Dragon
    const tagAlongButton = page.getByRole('button', {
      name: /toggle tag-along for dragon the dragon/i,
    })
    await tagAlongButton.click()

    // The "Set primary" button for Dragon should now be disabled (tag-alongs can't be primary)
    await expect(
      page.getByRole('button', { name: /set dragon the dragon as primary/i })
    ).toBeDisabled()
  })

  test('should set a different member as primary contact', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Set Dragon as primary
    await page.getByRole('button', { name: /set dragon the dragon as primary/i }).click()

    // Donkey's "Set primary" should now be enabled (no longer primary)
    await expect(
      page.getByRole('button', { name: /set donkey the donkey as primary/i })
    ).toBeEnabled()

    // Dragon's "Set primary" should now be disabled (already primary)
    await expect(
      page.getByRole('button', { name: /set dragon the dragon as primary/i })
    ).toBeDisabled()
  })

  test('should cancel without saving changes', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Add a guest
    await page.getByRole('button', { name: /add guest/i }).click()
    await expect(page.getByLabel('First name (member 3)')).toBeVisible()

    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Modal should close
    await expect(page.getByRole('heading', { name: /manage household members/i })).not.toBeVisible()
  })
})

test.describe('Guest List Drawer - Tags Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
  })

  test('should show inline tag input for each member in the modal', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Each member should have an inline tag input
    await expect(page.getByLabel('Tags for Donkey The Donkey')).toBeVisible()
    await expect(page.getByLabel('Tags for Dragon The Dragon')).toBeVisible()
  })

  test('should show existing tags as badges in the tag input', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Donkey has tags (Family, Bridal Party from seed data) shown as badges
    const donkeyTagInput = page.getByLabel('Tags for Donkey The Donkey').locator('..')
    await expect(donkeyTagInput.getByText('Family')).toBeVisible()
    await expect(donkeyTagInput.getByText('Bridal Party')).toBeVisible()
  })

  test('should filter tags when typing in the tag input', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Type in Dragon's tag input to filter
    const dragonTagInput = page.getByLabel('Tags for Dragon The Dragon')
    await dragonTagInput.fill('fam')

    // Dropdown should show filtered results containing "Family"
    await expect(page.getByRole('button', { name: /Family/i }).last()).toBeVisible()
  })

  test('should show create option when typing a non-existing tag name', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    const dragonTagInput = page.getByLabel('Tags for Dragon The Dragon')
    await dragonTagInput.fill('Neighbors')

    // Should show a "Create" option in the dropdown
    await expect(page.getByText('Create')).toBeVisible()
    await expect(page.getByText('Neighbors')).toBeVisible()
  })

  test('should remove a tag by clicking the remove button on its badge', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Remove the "Family" tag from Donkey
    await page.getByLabel('Remove Family').first().click()

    // The Family badge should no longer be in Donkey's tag input
    const donkeyTagInput = page.getByLabel('Tags for Donkey The Donkey').locator('..')
    await expect(donkeyTagInput.getByText('Family')).not.toBeVisible()
  })

  test('should allow editing tags for multiple members without leaving the modal', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Add a tag to Dragon by clicking in the dropdown
    const dragonTagInput = page.getByLabel('Tags for Dragon The Dragon')
    await dragonTagInput.click()

    // Click VIP in the dropdown
    await page.getByRole('button', { name: /VIP/i }).last().click()

    // Should still be in the members modal (not a separate tag modal)
    await expect(page.getByRole('heading', { name: /manage household members/i })).toBeVisible()
  })
})

test.describe('Guest List Drawer - Age Group Editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
  })

  test('should show age group selector for each member', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Each member should have an age group selector
    await expect(page.getByLabel('Age group for Donkey The Donkey')).toBeVisible()
    await expect(page.getByLabel('Age group for Dragon The Dragon')).toBeVisible()
  })

  test('should display current age group value', async ({ page }) => {
    // Three Bears household has Baby Bear as CHILD
    await page.getByRole('button', { name: /select papa.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Baby Bear should show "Child (3-12 years)" in the select
    const babyBearAgeGroup = page.getByLabel('Age group for Baby Bear')
    await expect(babyBearAgeGroup).toContainText(/Child/)
  })

  test('should allow changing age group', async ({ page }) => {
    await page.getByRole('button', { name: /select papa.*household/i }).click()
    await page.getByRole('button', { name: /manage members/i }).click()

    // Change Baby Bear from Child to Teen
    await page.getByLabel('Age group for Baby Bear').click()
    await page.getByRole('option', { name: /Teen/ }).click()

    // Should now show Teen
    await expect(page.getByLabel('Age group for Baby Bear')).toContainText(/Teen/)
  })
})

test.describe('Guest List Drawer - Delete Party', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guest-list')
  })

  test('should show delete party button in the drawer', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    await expect(page.getByRole('button', { name: /delete party/i })).toBeVisible()
  })

  test('should show delete confirmation dialog', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    await page.getByRole('button', { name: /delete party/i }).click()

    // Confirmation dialog should appear
    await expect(page.getByRole('heading', { name: /delete party\?/i })).toBeVisible()
    await expect(
      page.getByText(/this will permanently delete this party and all associated guests/i)
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete Party' })).toBeVisible()
  })

  test('should cancel deletion and keep the drawer open', async ({ page }) => {
    await page.getByRole('button', { name: /select donkey.*household/i }).click()
    await page.getByRole('button', { name: /delete party/i }).click()

    // Cancel the deletion
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Drawer should still be open
    await expect(page.getByRole('heading', { name: /donkey the donkey/i })).toBeVisible()
  })
})

test.describe('Guest List Drawer - Discard Changes Dialog', () => {
  test('should show discard dialog when closing drawer with unsaved edits', async ({ page }) => {
    await page.goto('/guest-list')

    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    // Enter edit mode and make a change
    await page.getByLabel('Edit Contact & Address').click()
    await page.locator('input[name="email"]').fill('donkey-changed@swamp.wed')

    // Try to close the drawer
    await page.getByLabel('Close guest details').click()

    // Discard dialog should appear
    await expect(page.getByText(/discard unsaved changes\?/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /keep editing/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /discard and close/i })).toBeVisible()
  })

  test('should return to editing when choosing keep editing', async ({ page }) => {
    await page.goto('/guest-list')

    await page.getByRole('button', { name: /select donkey.*household/i }).click()

    await page.getByLabel('Edit Contact & Address').click()
    await page.locator('input[name="email"]').fill('donkey-changed@swamp.wed')

    await page.getByLabel('Close guest details').click()

    // Click "Keep editing"
    await page.getByRole('button', { name: /keep editing/i }).click()

    // Drawer should still be open with the edit
    await expect(page.locator('input[name="email"]')).toHaveValue('donkey-changed@swamp.wed')
  })
})
