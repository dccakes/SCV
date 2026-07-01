/**
 * Shared helpers for ordering the couple's names wherever they're displayed
 * (templates, RSVP flow, dashboard) according to the wedding's chosen
 * `nameDisplayOrder` preference, instead of assuming groom-then-bride.
 */

import type { NameDisplayOrder } from '~/server/domains/wedding/wedding.types'

export type CoupleNameFields = {
  groomFirstName?: string | null
  groomLastName?: string | null
  brideFirstName?: string | null
  brideLastName?: string | null
}

export type OrderedPartner = {
  firstName: string | null
  lastName: string | null
}

/**
 * Returns the couple's names as `{ first, second }`, ordered per
 * `nameDisplayOrder`. Defaults to groom-first when no order is given, matching
 * the historical default before the preference existed.
 */
export function getOrderedPartners(
  data: CoupleNameFields,
  nameDisplayOrder?: NameDisplayOrder
): { first: OrderedPartner; second: OrderedPartner } {
  const groom: OrderedPartner = {
    firstName: data.groomFirstName ?? null,
    lastName: data.groomLastName ?? null,
  }
  const bride: OrderedPartner = {
    firstName: data.brideFirstName ?? null,
    lastName: data.brideLastName ?? null,
  }

  return nameDisplayOrder === 'BRIDE_FIRST'
    ? { first: bride, second: groom }
    : { first: groom, second: bride }
}

/**
 * Formats the couple's first names in display order, e.g. "Jane & John".
 */
export function formatCoupleNames(
  data: CoupleNameFields,
  nameDisplayOrder?: NameDisplayOrder,
  separator = ' & '
): string {
  const { first, second } = getOrderedPartners(data, nameDisplayOrder)
  return [first.firstName, second.firstName].filter(Boolean).join(separator)
}
