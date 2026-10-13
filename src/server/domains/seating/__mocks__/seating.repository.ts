import type {
  SeatableGuestRecord,
  SeatingTableRecord,
} from '~/server/domains/seating/seating.types'

export const mockTable: SeatingTableRecord = {
  id: 'table-1',
  weddingId: 'wedding-123',
  eventId: 'event-1',
  name: 'Table 1',
  shape: 'ROUND',
  capacity: 4,
  positionX: 40,
  positionY: 40,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  seatAssignments: [{ guestId: 1 }, { guestId: 2 }],
}

export const buildSeatableGuest = (
  overrides: Partial<SeatableGuestRecord['guest']> & { id: number },
  rsvp = 'Attending'
): SeatableGuestRecord => ({
  rsvp,
  dietaryRestrictions: null,
  guest: {
    firstName: `First${overrides.id}`,
    lastName: `Last${overrides.id}`,
    email: null,
    phone: null,
    ageGroup: 'ADULT',
    isPrimaryContact: false,
    isTagAlong: false,
    householdId: 'household-1',
    household: {
      id: 'household-1',
      address1: null,
      address2: null,
      city: null,
      state: null,
      zipCode: null,
      country: null,
      notes: null,
    },
    guestTagAssignments: [],
    seatAssignments: [],
    ...overrides,
  },
})

export const mockEventBelongsToWedding = jest.fn()
export const mockFindTablesByEventId = jest.fn()
export const mockFindSeatableGuests = jest.fn()
export const mockFindTableById = jest.fn()
export const mockCreateTable = jest.fn()
export const mockUpdateTable = jest.fn()
export const mockDeleteTable = jest.fn()
export const mockFindSeatableGuestIds = jest.fn()
export const mockReplaceAssignments = jest.fn()
export const mockDeleteAssignments = jest.fn()

export const SeatingRepository = jest.fn().mockImplementation(() => ({
  eventBelongsToWedding: mockEventBelongsToWedding,
  findTablesByEventId: mockFindTablesByEventId,
  findSeatableGuests: mockFindSeatableGuests,
  findTableById: mockFindTableById,
  createTable: mockCreateTable,
  updateTable: mockUpdateTable,
  deleteTable: mockDeleteTable,
  findSeatableGuestIds: mockFindSeatableGuestIds,
  replaceAssignments: mockReplaceAssignments,
  deleteAssignments: mockDeleteAssignments,
}))

export const resetMocks = (): void => {
  mockEventBelongsToWedding.mockReset()
  mockFindTablesByEventId.mockReset()
  mockFindSeatableGuests.mockReset()
  mockFindTableById.mockReset()
  mockCreateTable.mockReset()
  mockUpdateTable.mockReset()
  mockDeleteTable.mockReset()
  mockFindSeatableGuestIds.mockReset()
  mockReplaceAssignments.mockReset()
  mockDeleteAssignments.mockReset()
  SeatingRepository.mockClear()
}
