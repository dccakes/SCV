/**
 * User Service - Jest Manual Mock
 *
 * This mock is automatically used when jest.mock('~/server/domains/user/user.service') is called.
 */

export const mockCreate = jest.fn()
export const mockGetById = jest.fn()
export const mockGetByEmail = jest.fn()
export const mockUpdateProfile = jest.fn()

export const UserService = jest.fn().mockImplementation(() => ({
  create: mockCreate,
  getById: mockGetById,
  getByEmail: mockGetByEmail,
  updateProfile: mockUpdateProfile,
}))

// Helper to reset all mocks
export const resetMocks = (): void => {
  mockCreate.mockReset()
  mockGetById.mockReset()
  mockGetByEmail.mockReset()
  mockUpdateProfile.mockReset()
  UserService.mockClear()
}
