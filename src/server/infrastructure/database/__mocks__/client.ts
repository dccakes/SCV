/**
 * Database Client - Jest Manual Mock
 *
 * This mock is automatically used when jest.mock('~/server/infrastructure/database/client') is called.
 */

export const mockUserFindUnique = jest.fn()
export const mockUserFindFirst = jest.fn()
export const mockUserFindMany = jest.fn()
export const mockUserCreate = jest.fn()
export const mockUserUpdate = jest.fn()
export const mockUserDelete = jest.fn()

export const mockEventFindUnique = jest.fn()
export const mockEventFindFirst = jest.fn()
export const mockEventFindMany = jest.fn()
export const mockEventCreate = jest.fn()
export const mockEventUpdate = jest.fn()
export const mockEventDelete = jest.fn()

export const mockGuestFindMany = jest.fn()
export const mockInvitationCreate = jest.fn()

export const db = {
  user: {
    findUnique: mockUserFindUnique,
    findFirst: mockUserFindFirst,
    findMany: mockUserFindMany,
    create: mockUserCreate,
    update: mockUserUpdate,
    delete: mockUserDelete,
  },
  event: {
    findUnique: mockEventFindUnique,
    findFirst: mockEventFindFirst,
    findMany: mockEventFindMany,
    create: mockEventCreate,
    update: mockEventUpdate,
    delete: mockEventDelete,
  },
  guest: {
    findMany: mockGuestFindMany,
  },
  invitation: {
    create: mockInvitationCreate,
  },
}

// Helper to reset all mocks
export const resetMocks = (): void => {
  mockUserFindUnique.mockReset()
  mockUserFindFirst.mockReset()
  mockUserFindMany.mockReset()
  mockUserCreate.mockReset()
  mockUserUpdate.mockReset()
  mockUserDelete.mockReset()
  mockEventFindUnique.mockReset()
  mockEventFindFirst.mockReset()
  mockEventFindMany.mockReset()
  mockEventCreate.mockReset()
  mockEventUpdate.mockReset()
  mockEventDelete.mockReset()
  mockGuestFindMany.mockReset()
  mockInvitationCreate.mockReset()
}
