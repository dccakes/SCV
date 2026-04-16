/**
 * @jest-environment node
 */

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(() => ({ organizationId: 'org-1', role: 'owner' })),
}))

jest.mock('~/server/domains/guest/guest.repository')

import { TRPCError } from '@trpc/server'
import { requirePermission } from '~/server/authz/permission-checker'
import { GuestRepository } from '~/server/domains/guest/guest.repository'
import { GuestService } from '~/server/domains/guest/guest.service'

const mockRequirePermission = requirePermission as jest.Mock

const repo = new GuestRepository(null as never)
const mockRepo = repo as unknown as {
  findById: jest.Mock
  updateTags: jest.Mock
  belongsToWedding: jest.Mock
}

const service = new GuestService(repo)

const authz = { userId: 'user-1', activeOrganization: { organizationId: 'org-1', role: 'owner' } }

describe('GuestService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-1', role: 'owner' })
  })

  describe('updateGuestTags', () => {
    const weddingId = 'wedding-123'
    const guestId = 1
    const tagIds = ['tag-1', 'tag-2']

    it('checks guest update permission', async () => {
      mockRepo.findById.mockResolvedValue({ id: guestId, weddingId })
      mockRepo.updateTags.mockResolvedValue(undefined)

      await service.updateGuestTags(authz, weddingId, guestId, tagIds)

      expect(mockRequirePermission).toHaveBeenCalledWith(authz, { guest: ['update'] })
    })

    it('validates guest belongs to wedding', async () => {
      mockRepo.findById.mockResolvedValue({ id: guestId, weddingId })
      mockRepo.updateTags.mockResolvedValue(undefined)

      await service.updateGuestTags(authz, weddingId, guestId, tagIds)

      expect(mockRepo.findById).toHaveBeenCalledWith(guestId)
    })

    it('delegates to repository updateTags', async () => {
      mockRepo.findById.mockResolvedValue({ id: guestId, weddingId })
      mockRepo.updateTags.mockResolvedValue(undefined)

      await service.updateGuestTags(authz, weddingId, guestId, tagIds)

      expect(mockRepo.updateTags).toHaveBeenCalledWith(guestId, tagIds)
    })

    it('throws FORBIDDEN when guest not in wedding', async () => {
      mockRepo.findById.mockResolvedValue({ id: guestId, weddingId: 'other-wedding' })

      await expect(service.updateGuestTags(authz, weddingId, guestId, tagIds)).rejects.toThrow(
        TRPCError
      )
    })

    it('throws FORBIDDEN when guest not found', async () => {
      mockRepo.findById.mockResolvedValue(null)

      await expect(service.updateGuestTags(authz, weddingId, guestId, tagIds)).rejects.toThrow(
        TRPCError
      )
    })
  })
})
