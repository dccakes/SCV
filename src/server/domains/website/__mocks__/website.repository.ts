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
  userId: 'user-123',
  url: 'https://example.com/johndoeandjanesmith',
  subUrl: 'johndoeandjanesmith',
  groomFirstName: 'John',
  groomLastName: 'Doe',
  brideFirstName: 'Jane',
  brideLastName: 'Smith',
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
      userId: 'user-123',
      websiteId: 'website-123',
      eventId: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      options: [],
      _count: { answers: 0 },
    },
    {
      id: 'q-2',
      text: 'Send a note to the couple?',
      type: 'Text',
      userId: 'user-123',
      websiteId: 'website-123',
      eventId: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      options: [],
      _count: { answers: 0 },
    },
  ],
}

export const mockFindById = jest.fn()
export const mockFindByUserId = jest.fn()
export const mockFindBySubUrl = jest.fn()
export const mockFindBySubUrlWithQuestions = jest.fn()
export const mockCreate = jest.fn()
export const mockUpdate = jest.fn()
export const mockUpdateRsvpEnabled = jest.fn()
export const mockUpdateCoverPhoto = jest.fn()
export const mockExistsForUser = jest.fn()
export const mockIsSubUrlTaken = jest.fn()

export const WebsiteRepository = jest.fn().mockImplementation(() => ({
  findById: mockFindById,
  findByUserId: mockFindByUserId,
  findBySubUrl: mockFindBySubUrl,
  findBySubUrlWithQuestions: mockFindBySubUrlWithQuestions,
  create: mockCreate,
  update: mockUpdate,
  updateRsvpEnabled: mockUpdateRsvpEnabled,
  updateCoverPhoto: mockUpdateCoverPhoto,
  existsForUser: mockExistsForUser,
  isSubUrlTaken: mockIsSubUrlTaken,
}))

// Helper to reset all mocks
export const resetMocks = (): void => {
  mockFindById.mockReset()
  mockFindByUserId.mockReset()
  mockFindBySubUrl.mockReset()
  mockFindBySubUrlWithQuestions.mockReset()
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockUpdateRsvpEnabled.mockReset()
  mockUpdateCoverPhoto.mockReset()
  mockExistsForUser.mockReset()
  mockIsSubUrlTaken.mockReset()
  WebsiteRepository.mockClear()
}
