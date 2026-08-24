import { cookies } from 'next/headers'

import { householdInviteCookieName, websiteAccessCookieName } from '~/lib/website/cookies'
import { api } from '~/trpc/server'

export { websiteAccessCookieName } from '~/lib/website/cookies'

/** Credentials a public website visitor may carry, read from their cookies. */
export type WebsiteVisitorCookies = {
  /** Token proving a previous password unlock for this site. */
  accessToken: string | undefined
  /** Household invite token from a save-the-date / invite link. */
  inviteToken: string | undefined
}

/**
 * Read both the password-access and household-invite cookies for a website in a
 * single pass. Either (or both) may unlock a password-protected site.
 */
export async function readWebsiteVisitorCookies(
  websiteSubUrl: string
): Promise<WebsiteVisitorCookies> {
  const cookieStore = await cookies()
  return {
    accessToken: cookieStore.get(websiteAccessCookieName(websiteSubUrl))?.value,
    inviteToken: cookieStore.get(householdInviteCookieName(websiteSubUrl))?.value,
  }
}

/**
 * Verify a guest-supplied website password and, on success, set the scoped
 * access cookie. Returns whether access was granted.
 *
 * Shared by every public website route's password-unlock server action so the
 * cookie name, scope, and lifetime stay in one place.
 */
export async function grantWebsiteAccess(
  websiteSubUrl: string,
  passwordInput: string
): Promise<boolean> {
  const verificationToken = await api.website.verifyWebsitePassword({
    subUrl: websiteSubUrl,
    password: passwordInput,
  })

  if (!verificationToken) {
    return false
  }

  const cookieStore = await cookies()
  cookieStore.set(websiteAccessCookieName(websiteSubUrl), verificationToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: `/w/${websiteSubUrl}`,
    maxAge: 60 * 60 * 6,
  })

  return true
}
