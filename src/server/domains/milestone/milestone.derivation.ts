import { VendorCategory, VendorStatus } from '@prisma/client'

import type { CanonicalMilestoneKey } from '~/server/domains/milestone/milestone.seed'

export const MANUAL_MILESTONE_KEYS = [
  'save_the_dates_sent',
  'invitations_sent',
  'officiant_chosen',
  'marriage_license_obtained',
  'final_headcount_sent',
] as const satisfies ReadonlyArray<CanonicalMilestoneKey>

export type ManualMilestoneKey = (typeof MANUAL_MILESTONE_KEYS)[number]

export type DerivedMilestoneStatus = 'done' | 'pending'

export type MilestoneDerivationState = {
  primaryEventDate: Date | null
  guestCount: number
  vendors: ReadonlyArray<{
    category: VendorCategory
    status: VendorStatus
  }>
  invitations: ReadonlyArray<{
    rsvp: string | null
  }>
  now: Date
}

type EligibleRsvpValue = 'Invited' | 'Attending' | 'Declined'
type RespondedRsvpValue = Exclude<EligibleRsvpValue, 'Invited'>

const ELIGIBLE_RSVP_VALUES: ReadonlySet<EligibleRsvpValue> = new Set([
  'Invited',
  'Attending',
  'Declined',
])

const RESPONDED_RSVP_VALUES: ReadonlySet<RespondedRsvpValue> = new Set(['Attending', 'Declined'])

function hasSelectedVendor(
  vendors: MilestoneDerivationState['vendors'],
  category: VendorCategory
): boolean {
  return vendors.some(
    (vendor) => vendor.category === category && vendor.status === VendorStatus.SELECTED
  )
}

function deriveRsvpCollectedStatus(state: MilestoneDerivationState): DerivedMilestoneStatus {
  const eligibleInvitations = state.invitations.filter(
    (invitation): invitation is { rsvp: EligibleRsvpValue } =>
      invitation.rsvp !== null && ELIGIBLE_RSVP_VALUES.has(invitation.rsvp as EligibleRsvpValue)
  )

  if (eligibleInvitations.length === 0) {
    return 'pending'
  }

  const respondedCount = eligibleInvitations.filter(
    (invitation): invitation is { rsvp: RespondedRsvpValue } =>
      invitation.rsvp !== null && RESPONDED_RSVP_VALUES.has(invitation.rsvp as RespondedRsvpValue)
  ).length
  return respondedCount / eligibleInvitations.length >= 0.9 ? 'done' : 'pending'
}

function assertUnreachableKey(key: never): never {
  throw new Error(`Unhandled milestone key: ${key}`)
}

export function deriveMilestoneStatus(
  key: CanonicalMilestoneKey,
  state: MilestoneDerivationState
): DerivedMilestoneStatus {
  switch (key) {
    case 'date_set':
      return state.primaryEventDate ? 'done' : 'pending'
    case 'guest_list_drafted':
      return state.guestCount >= 1 ? 'done' : 'pending'
    case 'venue_booked':
      return hasSelectedVendor(state.vendors, VendorCategory.VENUE) ? 'done' : 'pending'
    case 'photographer_booked':
      return hasSelectedVendor(state.vendors, VendorCategory.PHOTOGRAPHER) ? 'done' : 'pending'
    case 'caterer_booked':
      return hasSelectedVendor(state.vendors, VendorCategory.CATERING) ? 'done' : 'pending'
    case 'florist_booked':
      return hasSelectedVendor(state.vendors, VendorCategory.FLOWERS) ? 'done' : 'pending'
    case 'save_the_dates_sent':
    case 'invitations_sent':
    case 'officiant_chosen':
    case 'marriage_license_obtained':
    case 'final_headcount_sent':
      return 'pending'
    case 'rsvps_collected':
      return deriveRsvpCollectedStatus(state)
    case 'wedding_day':
      return state.primaryEventDate && state.primaryEventDate < state.now ? 'done' : 'pending'
    default:
      return assertUnreachableKey(key)
  }
}
