import { expect, test as setup } from '@playwright/test'

const AUTH_FILE = 'tests/e2e/.auth/user.json'

setup('authenticate as seed user', async ({ page }) => {
  await page.goto('/auth/sign-in')

  // Wait for React hydration — the library sets noValidate on the form once hydrated
  await page.waitForFunction(() => document.querySelector('form')?.hasAttribute('novalidate'), {
    timeout: 15_000,
  })

  await page.getByLabel('Email').fill('shrek@swamp.wed')
  await page.getByLabel('Password').fill('password123')

  const responsePromise = page.waitForResponse(
    (res) => res.url().includes('/api/auth/sign-in/email'),
    { timeout: 15_000 }
  )
  await page.getByRole('button', { name: 'Login' }).click()
  await responsePromise

  // Navigate directly to dashboard — session cookie is now set
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL('/dashboard')

  await page.context().storageState({ path: AUTH_FILE })
})
