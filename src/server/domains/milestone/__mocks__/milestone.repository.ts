import { MilestoneCategory } from '@prisma/client'

import type {
  Milestone,
  MilestoneWithEffectiveStatus,
} from '~/server/domains/milestone/milestone.types'

export const mockMilestone: Milestone = {
  id: 'milestone-123',
  weddingId: 'wedding-123',
  key: 'venue_booked',
  title: 'Venue booked',
  category: MilestoneCategory.VENDORS,
  position: 2,
  targetDate: null,
  userOverrideStatus: null,
  attestedAt: null,
  dismissedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
}

export const mockMilestoneWithEffectiveStatus: MilestoneWithEffectiveStatus = {
  ...mockMilestone,
  derivedStatus: 'done',
  effectiveStatus: 'done',
}

export const mockFindById = jest.fn()
export const mockFindByWeddingId = jest.fn()
export const mockFindByWeddingIdWithEffectiveStatus = jest.fn()
export const mockCreate = jest.fn()
export const mockUpdate = jest.fn()
export const mockDelete = jest.fn()
export const mockBelongsToWedding = jest.fn()

export const MilestoneRepository = jest.fn().mockImplementation(() => ({
  findById: mockFindById,
  findByWeddingId: mockFindByWeddingId,
  findByWeddingIdWithEffectiveStatus: mockFindByWeddingIdWithEffectiveStatus,
  create: mockCreate,
  update: mockUpdate,
  delete: mockDelete,
  belongsToWedding: mockBelongsToWedding,
}))

export const resetMocks = (): void => {
  mockFindById.mockReset()
  mockFindByWeddingId.mockReset()
  mockFindByWeddingIdWithEffectiveStatus.mockReset()
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockDelete.mockReset()
  mockBelongsToWedding.mockReset()
  MilestoneRepository.mockClear()
}
