import { type GuestTag } from '~/server/domains/guest-tag/guest-tag.types'

// Export test fixtures
export const mockGuestTag: GuestTag = {
  id: 'tag-123',
  weddingId: 'wedding-123',
  name: 'Family',
  color: '#3b82f6',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockGuestTagWithCount = {
  ...mockGuestTag,
  _count: {
    guestTagAssignments: 5,
  },
}

// Export individual mock functions
export const mockCreate = jest.fn()
export const mockFindById = jest.fn()
export const mockFindByWeddingId = jest.fn()
export const mockUpdate = jest.fn()
export const mockDelete = jest.fn()
export const mockExistsByName = jest.fn()

// Export mocked class
export const GuestTagRepository = jest.fn().mockImplementation(() => ({
  create: mockCreate,
  findById: mockFindById,
  findByWeddingId: mockFindByWeddingId,
  update: mockUpdate,
  delete: mockDelete,
  existsByName: mockExistsByName,
}))

// Export reset helper
export const resetMocks = (): void => {
  mockCreate.mockReset()
  mockFindById.mockReset()
  mockFindByWeddingId.mockReset()
  mockUpdate.mockReset()
  mockDelete.mockReset()
  mockExistsByName.mockReset()
  GuestTagRepository.mockClear()
}
