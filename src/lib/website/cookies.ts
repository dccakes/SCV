/**
 * Cookie names for the public wedding-website flows.
 *
 * Both cookies are scoped per website (the slug is part of the name) so a guest
 * can hold credentials for several weddings at once without collisions.
 */

/**
 * Per-website household invite code, set when a guest opens their
 * save-the-date / invite link. Recognising this cookie lets us greet the guest
 * by name and skip the password prompt on a protected site.
 *
 * Scoped to `/w/<slug>` since both the invite flow and the website routes now
 * live under that prefix.
 */
export const householdInviteCookieName = (websiteSubUrl: string): string =>
  `household_invite_${websiteSubUrl}`

/** Path the household invite cookie is scoped to. */
export const householdInviteCookiePath = (websiteSubUrl: string): string => `/w/${websiteSubUrl}`

/** Per-website access token, set after a successful password unlock. */
export const websiteAccessCookieName = (websiteSubUrl: string): string =>
  `wws_access_${websiteSubUrl}`
