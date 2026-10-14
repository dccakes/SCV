import type { GuestAgeGroup, SeatingTable, SeatingTableShape } from '@prisma/client'

export type { SeatingTable, SeatingTableShape }

export type CreateSeatingTableInput = {
  eventId: string
  name: string
  shape: SeatingTableShape
  capacity: number
  positionX: number
  positionY: number
}

export type UpdateSeatingTableInput = {
  name?: string
  shape?: SeatingTableShape
  capacity?: number
  positionX?: number
  positionY?: number
}

export type AssignGuestsInput = {
  tableId: string
  guestIds: number[]
}

export type UnassignGuestsInput = {
  eventId: string
  guestIds: number[]
}

// Repository shapes
export type SeatingTableRecord = SeatingTable & {
  seatAssignments: Array<{ guestId: number }>
}

export type SeatableGuestRecord = {
  rsvp: string
  dietaryRestrictions: string | null
  guest: {
    id: number
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
    ageGroup: GuestAgeGroup | null
    isPrimaryContact: boolean
    isTagAlong: boolean
    householdId: string
    household: {
      id: string
      address1: string | null
      address2: string | null
      city: string | null
      state: string | null
      zipCode: string | null
      country: string | null
      notes: string | null
    }
    guestTagAssignments: Array<{ guestTag: { name: string } }>
    seatAssignments: Array<{ tableId: string }>
  }
}

// Operations available inside SeatingRepository.withLockedTable
export type SeatingTableLock = {
  // The table as read under the lock; authoritative for capacity checks
  table: { name: string; capacity: number }
  seatedGuestIds: () => Promise<number[]>
  replaceAssignments: (guestIds: number[]) => Promise<void>
  updateTable: (data: UpdateSeatingTableInput) => Promise<SeatingTable>
}

// Service output shapes
export type SeatingTableView = {
  id: string
  name: string
  shape: SeatingTableShape
  capacity: number
  positionX: number
  positionY: number
  guestIds: number[]
}

export type SeatingGuest = {
  id: number
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  ageGroup: GuestAgeGroup | null
  isPrimaryContact: boolean
  isTagAlong: boolean
  householdId: string
  rsvp: string
  dietaryRestrictions: string | null
  tags: string[]
  tableId: string | null
}

export type SeatingHousehold = {
  id: string
  address: string | null
  notes: string | null
  guests: SeatingGuest[]
}

export type SeatingChart = {
  tables: SeatingTableView[]
  households: SeatingHousehold[]
}
