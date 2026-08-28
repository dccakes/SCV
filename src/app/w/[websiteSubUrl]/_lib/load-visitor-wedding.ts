import { loadWeddingBySubUrl } from '~/app/w/[websiteSubUrl]/_lib/load-wedding-by-suburl'
import { readWebsiteVisitorCookies } from '~/app/w/[websiteSubUrl]/_lib/website-access'

/**
 * Resolve a public website visitor's credentials and load the wedding in one
 * step: read both the password-access and household-invite cookies, then fetch
 * the wedding data (which unlocks a protected site for a valid access token or a
 * recognized invite).
 *
 * Every public website route funnels through here so the invite token is always
 * threaded into the load — a page can't accidentally drop it. The returned
 * `inviteToken` lets the home page additionally personalize for the household.
 */
export async function loadVisitorWedding(websiteSubUrl: string) {
  const { accessToken, inviteToken } = await readWebsiteVisitorCookies(websiteSubUrl)
  const loadResult = await loadWeddingBySubUrl(websiteSubUrl, accessToken, inviteToken)
  return { loadResult, inviteToken }
}
