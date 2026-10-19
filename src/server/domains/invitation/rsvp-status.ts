/**
 * Invitation Domain - RSVP Status
 *
 * The closed set of RSVP states an invitation can hold. Every write path
 * validates against `rsvpStatusSchema`; reads stay `string` because rows
 * written before this rule may hold other values.
 *
 * Keep this file dependency-free apart from zod: client components import it
 * through `~/lib/constants/rsvp`.
 */

import { z } from 'zod'

export const RSVP_STATUS = {
  NOT_INVITED: 'Not Invited',
  INVITED: 'Invited',
  ATTENDING: 'Attending',
  DECLINED: 'Declined',
} as const

export type RsvpStatus = (typeof RSVP_STATUS)[keyof typeof RSVP_STATUS]

export const RSVP_STATUS_VALUES = [
  RSVP_STATUS.NOT_INVITED,
  RSVP_STATUS.INVITED,
  RSVP_STATUS.ATTENDING,
  RSVP_STATUS.DECLINED,
] as const satisfies readonly RsvpStatus[]

export const rsvpStatusSchema = z.enum(RSVP_STATUS_VALUES)

export const isRsvpStatus = (value: unknown): value is RsvpStatus =>
  rsvpStatusSchema.safeParse(value).success

/**
 * Narrow a stored value (read types stay `string`) for flows that write it
 * back, such as household edit forms. Unknown values use `fallback`.
 */
export const toRsvpStatus = (value: unknown, fallback: RsvpStatus): RsvpStatus =>
  isRsvpStatus(value) ? value : fallback
