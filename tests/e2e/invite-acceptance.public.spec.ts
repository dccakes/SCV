import { expect, test } from '@playwright/test'

test.describe('Invite Acceptance Handoff (Public)', () => {
  test('shows invitation-aware auth handoff for unauthenticated visitors', async ({ page }) => {
    await page.goto('/auth/accept-invitation?invitationId=inv_test_123')

    await expect(page.getByText('You were invited to join a wedding workspace')).toBeVisible()

    const signInLink = page.getByRole('link', { name: 'Sign in to continue' })
    await expect(signInLink).toHaveAttribute(
      'href',
      '/auth/sign-in?redirectTo=%2Fauth%2Faccept-invitation%3FinvitationId%3Dinv_test_123'
    )

    const signUpLink = page.getByRole('link', { name: 'Create account to continue' })
    await expect(signUpLink).toHaveAttribute(
      'href',
      '/auth/sign-up?redirectTo=%2Fauth%2Faccept-invitation%3FinvitationId%3Dinv_test_123'
    )
  })

  test('navigates to sign-in while preserving invitation callback context', async ({ page }) => {
    await page.goto('/auth/accept-invitation?invitationId=inv_test_123')

    await page.getByRole('link', { name: 'Sign in to continue' }).click()
    await expect(page).toHaveURL(
      '/auth/sign-in?redirectTo=%2Fauth%2Faccept-invitation%3FinvitationId%3Dinv_test_123'
    )
  })

  test('shows explicit invalid state when invitationId is missing', async ({ page }) => {
    await page.goto('/auth/accept-invitation')

    await expect(page.getByText('This invitation link is invalid')).toBeVisible()

    const goToSignIn = page.getByRole('link', { name: 'Go to sign in' })
    await expect(goToSignIn).toHaveAttribute('href', '/auth/sign-in')
  })
})
