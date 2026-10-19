/**
 * RSVP Status Constants
 *
 * The canonical list lives in the invitation domain so server validation and
 * the UI cannot drift apart. Re-exported here for client components.
 */

export {
  isRsvpStatus,
  RSVP_STATUS,
  RSVP_STATUS_VALUES,
  type RsvpStatus,
  toRsvpStatus,
} from '~/server/domains/invitation/rsvp-status'
