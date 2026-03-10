/**
 * Invitation Domain - Utilities
 *
 * Shared tag-along filtering logic for RSVP counting.
 * This is the single source of truth for determining which invitations
 * should be counted in RSVP statistics.
 */

import { RSVP_STATUS } from '~/lib/constants'

type InvitationWithTagAlong = {
  rsvp: string
  guest: { isTagAlong: boolean }
}

type GuestResponses = {
  attending: number
  invited: number
  declined: number
  notInvited: number
}

/**
 * Determine if an invitation should be counted in RSVP stats.
 * When allowTagAlongs is false, tag-along guest invitations are excluded.
 */
export function shouldCountInvitation(
  invitation: { guest: { isTagAlong: boolean } },
  allowTagAlongs: boolean
): boolean {
  if (!allowTagAlongs && invitation.guest.isTagAlong) return false
  return true
}

/**
 * Count RSVP responses from a list of invitations, filtering tag-alongs
 * based on the event's allowTagAlongs setting.
 */
export function countRsvpResponses(
  invitations: InvitationWithTagAlong[],
  allowTagAlongs: boolean
): GuestResponses {
  const responses: GuestResponses = { attending: 0, invited: 0, declined: 0, notInvited: 0 }

  for (const invitation of invitations) {
    if (!shouldCountInvitation(invitation, allowTagAlongs)) continue

    switch (invitation.rsvp) {
      case RSVP_STATUS.ATTENDING:
        responses.attending += 1
        break
      case RSVP_STATUS.INVITED:
        responses.invited += 1
        break
      case RSVP_STATUS.DECLINED:
        responses.declined += 1
        break
      default:
        responses.notInvited += 1
        break
    }
  }

  return responses
}
