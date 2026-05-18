import { expect, test } from '@playwright/test'

type InviteRecord = {
  createdAt: string
  email: string
  expiresAt: string
  id: string
  role: string
  status: string
}

const ACTIVE_INVITATION_EXPIRES_AT = '2099-04-15T12:00:00.000Z'

async function mockOrganizationInvitationApis(
  page: Parameters<(typeof test)['extend']>[0]['page'],
  options: {
    canCancel: boolean
    canCreate: boolean
    invitations: InviteRecord[]
    onCancelInvitation?: (body: unknown) => void
    onInviteMember?: (body: unknown) => void
  }
) {
  await page.route('**/organization/get-full-organization*', async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        id: 'org-seed-shrek-fiona',
        members: [],
        name: 'Swamp Wedding',
      }),
      contentType: 'application/json',
      status: 200,
    })
  })

  await page.route('**/organization/has-permission*', async (route, request) => {
    const body = request.postDataJSON() as {
      permissions?: {
        invitation?: string[]
        member?: string[]
      }
    }

    let success = true
    if (body.permissions?.invitation?.includes('create')) {
      success = options.canCreate
    } else if (body.permissions?.invitation?.includes('cancel')) {
      success = options.canCancel
    }

    await route.fulfill({
      body: JSON.stringify({ success }),
      contentType: 'application/json',
      status: 200,
    })
  })

  await page.route('**/organization/list-invitations*', async (route) => {
    await route.fulfill({
      body: JSON.stringify(options.invitations),
      contentType: 'application/json',
      status: 200,
    })
  })

  await page.route('**/organization/invite-member*', async (route, request) => {
    options.onInviteMember?.(request.postDataJSON())
    await route.fulfill({
      body: JSON.stringify({ id: 'invite-pending' }),
      contentType: 'application/json',
      status: 200,
    })
  })

  await page.route('**/organization/cancel-invitation*', async (route, request) => {
    options.onCancelInvitation?.(request.postDataJSON())
    await route.fulfill({
      body: JSON.stringify({ id: 'invite-pending', status: 'canceled' }),
      contentType: 'application/json',
      status: 200,
    })
  })
}

test.describe('Settings Outstanding Invites', () => {
  test('shows outstanding invites and sends resend/cancel requests', async ({ page }) => {
    let inviteMemberBody: unknown = null
    let cancelInvitationBody: unknown = null

    await mockOrganizationInvitationApis(page, {
      canCancel: true,
      canCreate: true,
      invitations: [
        {
          createdAt: '2026-04-06T12:00:00.000Z',
          email: 'pending@example.com',
          expiresAt: ACTIVE_INVITATION_EXPIRES_AT,
          id: 'invite-pending',
          role: 'member',
          status: 'pending',
        },
        {
          createdAt: '2026-04-05T12:00:00.000Z',
          email: 'accepted@example.com',
          expiresAt: ACTIVE_INVITATION_EXPIRES_AT,
          id: 'invite-accepted',
          role: 'admin',
          status: 'accepted',
        },
      ],
      onCancelInvitation: (body) => {
        cancelInvitationBody = body
      },
      onInviteMember: (body) => {
        inviteMemberBody = body
      },
    })

    await page.goto('/settings')
    await expect(page.getByText('Outstanding Invites')).toBeVisible()
    await expect(page.getByText('pending@example.com')).toBeVisible()
    await expect(page.getByText('accepted@example.com')).toHaveCount(0)

    await page.getByRole('button', { name: 'Resend' }).click()
    await expect.poll(() => inviteMemberBody).not.toBeNull()
    expect(inviteMemberBody).toMatchObject({
      email: 'pending@example.com',
      organizationId: 'org-seed-shrek-fiona',
      resend: true,
      role: 'member',
    })

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect.poll(() => cancelInvitationBody).not.toBeNull()
    expect(cancelInvitationBody).toMatchObject({
      invitationId: 'invite-pending',
    })
  })

  test('hides the card when invitation:create is missing', async ({ page }) => {
    await mockOrganizationInvitationApis(page, {
      canCancel: true,
      canCreate: false,
      invitations: [
        {
          createdAt: '2026-04-06T12:00:00.000Z',
          email: 'pending@example.com',
          expiresAt: ACTIVE_INVITATION_EXPIRES_AT,
          id: 'invite-pending',
          role: 'member',
          status: 'pending',
        },
      ],
    })

    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Organization Members' })).toBeVisible()
    await expect(page.getByText('Outstanding Invites')).toHaveCount(0)
  })
})
