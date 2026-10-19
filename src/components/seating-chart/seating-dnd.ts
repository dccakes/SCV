import { formatGuestName } from '~/lib/seating/guest-name'

export type GuestDragData = { type: 'guests'; guestIds: number[]; label: string }
type TableDragData = { type: 'table'; tableId: string }
export type DragData = GuestDragData | TableDragData

export type TableDropData = { type: 'table'; tableId: string }
export type UnassignedDropData = { type: 'unassigned' }
export type DropData = TableDropData | UnassignedDropData

export const UNASSIGNED_DROP_ID = 'unassigned'

export const guestDragData = (guest: {
  id: number
  firstName: string
  lastName: string
}): GuestDragData => ({ type: 'guests', guestIds: [guest.id], label: formatGuestName(guest) })

export const getInitials = (guest: { firstName: string; lastName: string }) =>
  `${guest.firstName.charAt(0)}${guest.lastName.charAt(0)}`.toUpperCase()
