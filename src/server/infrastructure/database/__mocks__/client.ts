/**
 * Database Client - Jest Manual Mock
 *
 * This mock is automatically used when jest.mock('~/server/infrastructure/database/client') is called.
 */

import type { PrismaClient } from '@prisma/client'

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

export const mockGuestFindUnique = jest.fn()
export const mockGuestFindMany = jest.fn()
export const mockGuestCreate = jest.fn()
export const mockGuestUpsert = jest.fn()
export const mockGuestUpdateMany = jest.fn()
export const mockGuestDeleteMany = jest.fn()

export const mockInvitationCreate = jest.fn()
export const mockInvitationCreateMany = jest.fn()
export const mockInvitationUpdate = jest.fn()
export const mockInvitationDeleteMany = jest.fn()

export const mockGuestTagAssignmentCreateMany = jest.fn()
export const mockGuestTagAssignmentDeleteMany = jest.fn()

export const mockHouseholdCreate = jest.fn()
export const mockHouseholdUpdate = jest.fn()

export const mockGiftUpsert = jest.fn()

export const mockWeddingFindUnique = jest.fn()
export const mockWeddingFindFirst = jest.fn()
export const mockWeddingCreate = jest.fn()
export const mockWeddingUpdate = jest.fn()

export const mockMemberQueryRaw = jest.fn()

const dbModels = {
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
    findUnique: mockGuestFindUnique,
    findMany: mockGuestFindMany,
    create: mockGuestCreate,
    upsert: mockGuestUpsert,
    updateMany: mockGuestUpdateMany,
    deleteMany: mockGuestDeleteMany,
  },
  guestTagAssignment: {
    createMany: mockGuestTagAssignmentCreateMany,
    deleteMany: mockGuestTagAssignmentDeleteMany,
  },
  invitation: {
    create: mockInvitationCreate,
    createMany: mockInvitationCreateMany,
    update: mockInvitationUpdate,
    deleteMany: mockInvitationDeleteMany,
  },
  household: {
    create: mockHouseholdCreate,
    update: mockHouseholdUpdate,
  },
  gift: {
    upsert: mockGiftUpsert,
  },
  wedding: {
    findUnique: mockWeddingFindUnique,
    findFirst: mockWeddingFindFirst,
    create: mockWeddingCreate,
    update: mockWeddingUpdate,
  },
}

// $transaction executes the callback with the same mock db (tx = db)
const mock$transaction = jest.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => {
  return fn(dbModels)
})

export const db = {
  ...dbModels,
  $transaction: mock$transaction,
  $queryRaw: mockMemberQueryRaw,
  $executeRaw: jest.fn(),
} as unknown as PrismaClient

export { mock$transaction }

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
  mockGuestFindUnique.mockReset()
  mockGuestFindMany.mockReset()
  mockGuestCreate.mockReset()
  mockGuestUpsert.mockReset()
  mockGuestUpdateMany.mockReset()
  mockGuestDeleteMany.mockReset()
  mockInvitationCreate.mockReset()
  mockInvitationCreateMany.mockReset()
  mockInvitationUpdate.mockReset()
  mockInvitationDeleteMany.mockReset()
  mockGuestTagAssignmentCreateMany.mockReset()
  mockGuestTagAssignmentDeleteMany.mockReset()
  mockHouseholdCreate.mockReset()
  mockHouseholdUpdate.mockReset()
  mockGiftUpsert.mockReset()
  mockWeddingFindUnique.mockReset()
  mockWeddingFindFirst.mockReset()
  mockWeddingCreate.mockReset()
  mockWeddingUpdate.mockReset()
  mockMemberQueryRaw.mockReset()
  mock$transaction.mockClear()
  // Re-implement $transaction after clear
  mock$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
    return fn(dbModels)
  })
}
