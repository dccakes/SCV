/**
 * Website Repository - Jest Manual Mock
 *
 * This mock is automatically used when jest.mock('~/server/domains/website/website.repository') is called.
 */

import { type Website, type WebsiteWithQuestions } from '~/server/domains/website/website.types'

export const mockWebsite: Website = {
  id: 'website-123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  weddingId: 'wedding-123',
  url: 'https://example.com/johndoeandjanesmith',
  subUrl: 'johndoeandjanesmith',
  isPasswordEnabled: false,
  password: null,
  isRsvpEnabled: true,
  coverPhotoUrl: null,
}

export const mockWebsiteWithQuestions: WebsiteWithQuestions = {
  ...mockWebsite,
  generalQuestions: [
    {
      id: 'q-1',
      text: 'Will you be bringing any children under the age of 10?',
      type: 'Text',
      isRequired: false,
      websiteId: 'website-123',
      eventId: null,
      options: [],
      _count: { answers: 0 },
    },
    {
      id: 'q-2',
      text: 'Send a note to the couple?',
      type: 'Text',
      isRequired: false,
      websiteId: 'website-123',
      eventId: null,
      options: [],
      _count: { answers: 0 },
    },
  ],
}

export const mockFindById = jest.fn()
export const mockFindByWeddingId = jest.fn()
export const mockFindBySubUrl = jest.fn()
export const mockFindBySubUrlWithQuestions = jest.fn()
export const mockCreate = jest.fn()
export const mockUpdate = jest.fn()
export const mockUpdateRsvpEnabled = jest.fn()
export const mockUpdateCoverPhoto = jest.fn()
export const mockExistsForWedding = jest.fn()
export const mockIsSubUrlTaken = jest.fn()

export const WebsiteRepository = jest.fn().mockImplementation(() => ({
  findById: mockFindById,
  findByWeddingId: mockFindByWeddingId,
  findBySubUrl: mockFindBySubUrl,
  findBySubUrlWithQuestions: mockFindBySubUrlWithQuestions,
  create: mockCreate,
  update: mockUpdate,
  updateRsvpEnabled: mockUpdateRsvpEnabled,
  updateCoverPhoto: mockUpdateCoverPhoto,
  existsForWedding: mockExistsForWedding,
  isSubUrlTaken: mockIsSubUrlTaken,
}))

// Helper to reset all mocks
export const resetMocks = (): void => {
  mockFindById.mockReset()
  mockFindByWeddingId.mockReset()
  mockFindBySubUrl.mockReset()
  mockFindBySubUrlWithQuestions.mockReset()
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockUpdateRsvpEnabled.mockReset()
  mockUpdateCoverPhoto.mockReset()
  mockExistsForWedding.mockReset()
  mockIsSubUrlTaken.mockReset()
  WebsiteRepository.mockClear()
}
