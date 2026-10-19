/**
 * Seating Domain - Pure rules
 *
 * Shared by the service (authoritative checks) and the client (drop previews).
 */

import { RSVP_STATUS } from '~/lib/constants/rsvp'

// RSVP values that mean the guest will not be at the event
export const NON_SEATABLE_RSVPS = [RSVP_STATUS.DECLINED, RSVP_STATUS.NOT_INVITED] as const

export const MIN_TABLE_CAPACITY = 1
export const MAX_TABLE_CAPACITY = 30

export const getSeatsNeeded = (
  seatedGuestIds: readonly number[],
  incomingGuestIds: readonly number[]
): number => {
  const seated = new Set(seatedGuestIds)
  return new Set(incomingGuestIds.filter((id) => !seated.has(id))).size
}

type TableSeats = { capacity: number; guestIds: readonly number[] }

export const getOpenSeats = (table: TableSeats): number =>
  Math.max(0, table.capacity - table.guestIds.length)

export const tableHasRoom = (table: TableSeats, incomingGuestIds: readonly number[]): boolean =>
  table.guestIds.length + getSeatsNeeded(table.guestIds, incomingGuestIds) <= table.capacity

export const openSeatsMessage = (tableName: string, openSeats: number): string =>
  `${tableName} only has ${openSeats} open seat${openSeats === 1 ? '' : 's'}`
