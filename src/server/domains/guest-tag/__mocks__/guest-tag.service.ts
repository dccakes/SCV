// Export individual mock functions
export const mockCreate = jest.fn()
export const mockGetByWeddingId = jest.fn()
export const mockGetByIdWithCount = jest.fn()
export const mockUpdate = jest.fn()
export const mockDelete = jest.fn()
export const mockSeedInitialTags = jest.fn()

// Export mocked class
export const GuestTagService = jest.fn().mockImplementation(() => ({
  create: mockCreate,
  getByWeddingId: mockGetByWeddingId,
  getByIdWithCount: mockGetByIdWithCount,
  update: mockUpdate,
  delete: mockDelete,
  seedInitialTags: mockSeedInitialTags,
}))

// Export reset helper
export const resetMocks = (): void => {
  mockCreate.mockReset()
  mockGetByWeddingId.mockReset()
  mockGetByIdWithCount.mockReset()
  mockUpdate.mockReset()
  mockDelete.mockReset()
  mockSeedInitialTags.mockReset()
  GuestTagService.mockClear()
}
