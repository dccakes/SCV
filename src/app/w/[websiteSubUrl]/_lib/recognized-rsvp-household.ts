import { householdInviteService } from '~/server/application/household-invite'
import type { HouseholdSearchResult } from '~/server/domains/household/household.types'

/**
 * Resolve the household behind a guest's invite token in the RSVP flow shape, so
 * a guest arriving from their save-the-date link can RSVP without searching for
 * their name. Returns null when there is no token, the token is invalid/expired,
 * or it does not belong to this website's wedding — in which case the RSVP flow
 * falls back to the name search.
 */
export async function resolveRecognizedRsvpHousehold(
  websiteSubUrl: string,
  inviteToken: string | undefined
): Promise<HouseholdSearchResult | null> {
  if (!inviteToken) return null
  return householdInviteService.getRecognizedRsvpHousehold(websiteSubUrl, inviteToken)
}
