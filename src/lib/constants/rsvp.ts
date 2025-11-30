/**
 * RSVP Status Constants
 *
 * Defines the possible RSVP statuses used throughout the application.
 */

export const RSVP_STATUS = {
  PENDING: 'Pending',
  NOT_INVITED: 'Not Invited',
  INVITED: 'Invited',
  ATTENDING: 'Attending',
  DECLINED: 'Declined',
} as const

export type RsvpStatus = (typeof RSVP_STATUS)[keyof typeof RSVP_STATUS]

/**
 * Array of all RSVP statuses for iteration/validation
 */
export const RSVP_STATUS_VALUES = Object.values(RSVP_STATUS)
