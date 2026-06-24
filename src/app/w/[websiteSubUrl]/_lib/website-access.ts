import { cookies } from 'next/headers'

import { api } from '~/trpc/server'

/** Name of the per-website access cookie set after a successful password unlock. */
export const websiteAccessCookieName = (websiteSubUrl: string): string =>
  `wws_access_${websiteSubUrl}`

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
