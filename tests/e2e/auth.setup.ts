import { expect, test as setup } from '@playwright/test'

const AUTH_FILE = 'tests/e2e/.auth/user.json'

setup('authenticate as seed user', async ({ page }) => {
  // Navigate to sign-in page and wait for the auth UI to hydrate
  await page.goto('/auth/sign-in')
  await page.waitForLoadState('networkidle')

  // Fill in credentials from the seed fixture (shrek@swamp.wed / password123)
  // The @daveyplate/better-auth-ui library renders "Email" and "Password" labels
  await page.getByLabel('Email').fill('shrek@swamp.wed')
  await page.getByLabel('Password').fill('password123')

  // Submit the form — the auth UI uses "Login" as the submit button text
  await page.getByRole('button', { name: 'Login' }).click()

  // Wait for redirect to dashboard after successful login
  await page.waitForURL('/dashboard', { timeout: 15_000 })
  await expect(page).toHaveURL('/dashboard')

  // Save signed-in state for reuse across tests
  await page.context().storageState({ path: AUTH_FILE })
})
