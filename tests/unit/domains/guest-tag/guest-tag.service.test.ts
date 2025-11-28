import { TRPCError } from '@trpc/server'

jest.mock('~/server/domains/guest-tag/guest-tag.repository')

// @ts-expect-error - Importing mock functions from mocked module
import {
  GuestTagRepository,
  mockCreate,
  mockDelete,
  mockExistsByName,
  mockFindById,
  mockFindByWeddingId,
  mockGuestTag,
  mockGuestTagWithCount,
  mockUpdate,
  resetMocks,
} from '~/server/domains/guest-tag/guest-tag.repository'
import { GuestTagService } from '~/server/domains/guest-tag/guest-tag.service'

const mockCreateFn = mockCreate as jest.Mock
const mockFindByIdFn = mockFindById as jest.Mock
const mockFindByWeddingIdFn = mockFindByWeddingId as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock
const mockDeleteFn = mockDelete as jest.Mock
const mockExistsByNameFn = mockExistsByName as jest.Mock

describe('GuestTagService', () => {
  let guestTagService: GuestTagService

  beforeEach(() => {
    resetMocks()
    const mockRepository = new GuestTagRepository()
    guestTagService = new GuestTagService(mockRepository)
  })

  describe('create', () => {
    it('should create tag with name and color', async () => {
      mockExistsByNameFn.mockResolvedValue(false)
      mockCreateFn.mockResolvedValue(mockGuestTag)

      const result = await guestTagService.create({
        weddingId: 'wedding-123',
        name: 'Family',
        color: '#3b82f6',
      })

      expect(result).toEqual(mockGuestTag)
      expect(mockCreateFn).toHaveBeenCalledWith({
        weddingId: 'wedding-123',
        name: 'Family',
        color: '#3b82f6',
      })
    })

    it('should create tag without color', async () => {
      mockExistsByNameFn.mockResolvedValue(false)
      mockCreateFn.mockResolvedValue({ ...mockGuestTag, color: null })

      const result = await guestTagService.create({
        weddingId: 'wedding-123',
        name: 'Friends',
      })

      expect(result.color).toBeNull()
    })

    it('should prevent duplicate tag names per wedding', async () => {
      mockExistsByNameFn.mockResolvedValue(true)

      await expect(
        guestTagService.create({
          weddingId: 'wedding-123',
          name: 'Family',
          color: '#3b82f6',
        })
      ).rejects.toThrow(TRPCError)

      expect(mockCreateFn).not.toHaveBeenCalled()
    })

    it('should trim tag name before creation', async () => {
      mockExistsByNameFn.mockResolvedValue(false)
      mockCreateFn.mockResolvedValue(mockGuestTag)

      await guestTagService.create({
        weddingId: 'wedding-123',
        name: '  Family  ',
        color: '#3b82f6',
      })

      expect(mockExistsByNameFn).toHaveBeenCalledWith('wedding-123', 'Family')
    })
  })

  describe('getByWeddingId', () => {
    it('should return all tags for a wedding', async () => {
      const tags = [mockGuestTag, { ...mockGuestTag, id: 'tag-456', name: 'Friends' }]
      mockFindByWeddingIdFn.mockResolvedValue(tags)

      const result = await guestTagService.getByWeddingId('wedding-123')

      expect(result).toEqual(tags)
      expect(mockFindByWeddingIdFn).toHaveBeenCalledWith('wedding-123')
    })

    it('should return empty array if no tags exist', async () => {
      mockFindByWeddingIdFn.mockResolvedValue([])

      const result = await guestTagService.getByWeddingId('wedding-123')

      expect(result).toEqual([])
    })
  })

  describe('getByIdWithCount', () => {
    it('should return tag with guest count', async () => {
      mockFindByIdFn.mockResolvedValue(mockGuestTagWithCount)

      const result = await guestTagService.getByIdWithCount('tag-123')

      expect(result).toEqual(mockGuestTagWithCount)
      expect(result?._count?.guestTagAssignments).toBe(5)
    })

    it('should return null if tag not found', async () => {
      mockFindByIdFn.mockResolvedValue(null)

      const result = await guestTagService.getByIdWithCount('nonexistent-id')

      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('should update tag name', async () => {
      const updatedTag = { ...mockGuestTag, name: 'Extended Family' }
      mockExistsByNameFn.mockResolvedValue(false)
      mockUpdateFn.mockResolvedValue(updatedTag)

      const result = await guestTagService.update('tag-123', 'wedding-123', {
        name: 'Extended Family',
      })

      expect(result).toEqual(updatedTag)
      expect(mockUpdateFn).toHaveBeenCalledWith('tag-123', {
        name: 'Extended Family',
      })
    })

    it('should update tag color', async () => {
      const updatedTag = { ...mockGuestTag, color: '#10b981' }
      mockUpdateFn.mockResolvedValue(updatedTag)

      const result = await guestTagService.update('tag-123', 'wedding-123', {
        color: '#10b981',
      })

      expect(result.color).toBe('#10b981')
    })

    it('should prevent duplicate tag names when updating', async () => {
      mockExistsByNameFn.mockResolvedValue(true)

      await expect(
        guestTagService.update('tag-123', 'wedding-123', {
          name: 'Family',
        })
      ).rejects.toThrow(TRPCError)

      expect(mockUpdateFn).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('should delete tag', async () => {
      mockDeleteFn.mockResolvedValue(mockGuestTag)

      const result = await guestTagService.delete('tag-123')

      expect(result).toEqual(mockGuestTag)
      expect(mockDeleteFn).toHaveBeenCalledWith('tag-123')
    })
  })

  describe('seedInitialTags', () => {
    it('should create multiple tags for new wedding', async () => {
      const initialTags = [
        { name: 'Family', color: '#3b82f6' },
        { name: 'Friends', color: '#10b981' },
        { name: 'Coworkers', color: '#8b5cf6' },
      ]

      mockExistsByNameFn.mockResolvedValue(false)
      mockCreateFn.mockResolvedValue(mockGuestTag)

      await guestTagService.seedInitialTags('wedding-123', initialTags)

      expect(mockCreateFn).toHaveBeenCalledTimes(3)
      expect(mockCreateFn).toHaveBeenCalledWith({
        weddingId: 'wedding-123',
        name: 'Family',
        color: '#3b82f6',
      })
    })

    it('should skip tags that already exist', async () => {
      const initialTags = [
        { name: 'Family', color: '#3b82f6' },
        { name: 'Friends', color: '#10b981' },
      ]

      // First tag exists, second doesn't
      mockExistsByNameFn.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
      mockCreateFn.mockResolvedValue(mockGuestTag)

      await guestTagService.seedInitialTags('wedding-123', initialTags)

      // Should only create the second tag
      expect(mockCreateFn).toHaveBeenCalledTimes(1)
      expect(mockCreateFn).toHaveBeenCalledWith({
        weddingId: 'wedding-123',
        name: 'Friends',
        color: '#10b981',
      })
    })
  })
})
