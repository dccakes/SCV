import { expect, test } from '@playwright/test'

async function loginAsSeedUser(page: import('@playwright/test').Page, email: string) {
  await page.goto('/auth/sign-in')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Login' }).click()
}

test.describe('Permissions Matrix Smoke', () => {
  test('owner session can access protected management pages', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')

    await page.goto('/events')
    await expect(page).toHaveURL('/events')

    await page.goto('/guest-list')
    await expect(page).toHaveURL('/guest-list')

    await page.goto('/vendors')
    await expect(page).toHaveURL('/vendors')

    await page.goto('/settings', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await expect(page).toHaveURL('/settings')
  })

  test('unauthenticated users are blocked from protected pages', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const page = await context.newPage()

    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=%2Fdashboard$/)

    await page.goto('/events')
    await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=%2Fevents$/)

    await page.goto('/guest-list')
    await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=%2Fguest-list$/)

    await page.goto('/vendors')
    await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=%2Fvendors$/)

    await page.goto('/settings')
    await expect(page).toHaveURL(/\/auth\/sign-in\?callbackUrl=%2Fsettings$/)

    await context.close()
  })

  test('member session can still access planning pages', async ({ browser }) => {
    test.setTimeout(60_000)
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const page = await context.newPage()

    await loginAsSeedUser(page, 'fiona@swamp.wed')
    await page.waitForURL('/dashboard', { timeout: 15_000 })
    await expect(page).toHaveURL('/dashboard')

    await page.goto('/events')
    await expect(page).toHaveURL('/events')

    await page.goto('/guest-list')
    await expect(page).toHaveURL('/guest-list')

    await page.goto('/vendors')
    await expect(page).toHaveURL('/vendors')

    await page.goto('/settings', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await expect(page).toHaveURL('/settings')

    await context.close()
  })

  test('viewer session is blocked from protected management pages', async ({ browser }) => {
    test.setTimeout(60_000)
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const page = await context.newPage()

    await loginAsSeedUser(page, 'queen.lillian@swamp.wed')
    await page.waitForURL('/', { timeout: 15_000 })
    await expect(page).toHaveURL('/')

    await page.goto('/dashboard')
    await expect(page).toHaveURL('/')

    await page.goto('/events')
    await expect(page).toHaveURL('/')

    await page.goto('/guest-list')
    await expect(page).toHaveURL('/')

    await page.goto('/vendors')
    await expect(page).toHaveURL('/')

    await page.goto('/settings', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await expect(page).toHaveURL('/')

    await context.close()
  })

  test('public RSVP route remains accessible without auth', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const page = await context.newPage()

    await page.goto('/shrek-fiona/rsvp')
    await expect(page.locator('body')).not.toContainText('Application error')

    await context.close()
  })

  test('dashboard renders manage RSVPs CTA on the RSVP card', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: 'Manage RSVPs →' })).toHaveAttribute(
      'href',
      '/guest-list'
    )
  })

  test('owner is authorized by the live Better Auth permission endpoint', async ({ page }) => {
    const response = await page.request.post(
      'http://localhost:3000/api/auth/organization/has-permission',
      {
        headers: { Origin: 'http://localhost:3000' },
        data: {
          organizationId: 'org-seed-shrek-fiona',
          permissions: {
            organization: ['update', 'delete'],
            member: ['create', 'update', 'delete'],
            invitation: ['create', 'cancel'],
            guest_invitation: ['read', 'create', 'send', 'resend', 'cancel'],
            guest_event: ['read', 'add_guest_to_event', 'remove_guest_from_event'],
            rsvp: ['read_responses', 'edit_response', 'export', 'reopen_submission'],
            event: ['read', 'create', 'update', 'delete', 'rsvp_policy_update'],
            guest: ['read', 'create', 'update', 'delete', 'import'],
            vendor: ['read', 'create', 'update', 'delete'],
            vendor_quote: ['read', 'create', 'update', 'delete'],
            budget: ['read', 'create', 'update', 'delete'],
            website: ['read', 'update', 'publish', 'password_update'],
            wedding: ['read', 'update'],
          },
        },
      }
    )

    expect(response.status()).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ error: null, success: true })
  })

  test('member endpoint grants and denies permissions', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const page = await context.newPage()

    await loginAsSeedUser(page, 'fiona@swamp.wed')
    await page.waitForURL('/dashboard', { timeout: 15_000 })

    const allowed = await page.request.post(
      'http://localhost:3000/api/auth/organization/has-permission',
      {
        headers: { Origin: 'http://localhost:3000' },
        data: {
          organizationId: 'org-seed-shrek-fiona',
          permissions: { wedding: ['update'], guest_event: ['add_guest_to_event'] },
        },
      }
    )
    expect(allowed.status()).toBe(200)
    await expect(allowed.json()).resolves.toMatchObject({ error: null, success: true })

    const denied = await page.request.post(
      'http://localhost:3000/api/auth/organization/has-permission',
      {
        headers: { Origin: 'http://localhost:3000' },
        data: {
          organizationId: 'org-seed-shrek-fiona',
          permissions: {
            member: ['update'],
            guest_invitation: ['send'],
          },
        },
      }
    )
    expect(denied.status()).toBe(200)
    await expect(denied.json()).resolves.toMatchObject({ error: null, success: false })

    await context.close()
  })

  test('viewer is denied permissions by the live Better Auth endpoint', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const page = await context.newPage()

    await loginAsSeedUser(page, 'queen.lillian@swamp.wed')
    await page.waitForURL('/', { timeout: 15_000 })

    const response = await page.request.post(
      'http://localhost:3000/api/auth/organization/has-permission',
      {
        headers: { Origin: 'http://localhost:3000' },
        data: {
          organizationId: 'org-seed-shrek-fiona',
          permissions: {
            wedding: ['read'],
            event: ['read'],
            guest: ['create'],
          },
        },
      }
    )
    expect(response.status()).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ error: null, success: false })

    await context.close()
  })

  test('unauthenticated permission requests are rejected', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    })
    const page = await context.newPage()

    const response = await page.request.post(
      'http://localhost:3000/api/auth/organization/has-permission',
      {
        headers: { Origin: 'http://localhost:3000' },
        data: {
          organizationId: 'org-seed-shrek-fiona',
          permissions: { wedding: ['read'] },
        },
      }
    )

    expect(response.status()).toBe(401)
    await context.close()
  })

  test('owner cannot query another organization', async ({ page }) => {
    const response = await page.request.post(
      'http://localhost:3000/api/auth/organization/has-permission',
      {
        headers: { Origin: 'http://localhost:3000' },
        data: {
          organizationId: '00000000-0000-4000-8000-000000000001',
          permissions: { organization: ['update'] },
        },
      }
    )

    expect(response.status()).toBe(401)
    await expect(response.json()).resolves.toMatchObject({
      code: 'USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION',
    })
  })
})
