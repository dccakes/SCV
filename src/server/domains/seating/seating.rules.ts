/**
 * Seating Domain - Pure rules
 *
 * Shared by the service (authoritative checks) and the client (drop previews).
 */

// RSVP values that mean the guest will not be at the event
export const NON_SEATABLE_RSVPS = ['Declined', 'Not Invited'] as const

export const MIN_TABLE_CAPACITY = 1
export const MAX_TABLE_CAPACITY = 30

export const isSeatableRsvp = (rsvp: string): boolean =>
  !(NON_SEATABLE_RSVPS as readonly string[]).includes(rsvp)

export const getSeatsNeeded = (
  seatedGuestIds: readonly number[],
  incomingGuestIds: readonly number[]
): number => {
  const seated = new Set(seatedGuestIds)
  return new Set(incomingGuestIds.filter((id) => !seated.has(id))).size
}

export const hasRoomForGuests = (
  table: { capacity: number; seatedGuestIds: readonly number[] },
  incomingGuestIds: readonly number[]
): boolean =>
  table.seatedGuestIds.length + getSeatsNeeded(table.seatedGuestIds, incomingGuestIds) <=
  table.capacity
