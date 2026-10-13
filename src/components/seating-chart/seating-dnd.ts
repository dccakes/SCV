export type GuestDragData = { type: 'guests'; guestIds: number[]; label: string }
export type TableDragData = { type: 'table'; tableId: string }
export type DragData = GuestDragData | TableDragData

export type TableDropData = { type: 'table'; tableId: string }
export type UnassignedDropData = { type: 'unassigned' }
export type DropData = TableDropData | UnassignedDropData

export const UNASSIGNED_DROP_ID = 'unassigned'

export const getInitials = (guest: { firstName: string; lastName: string }) =>
  `${guest.firstName.charAt(0)}${guest.lastName.charAt(0)}`.toUpperCase()
