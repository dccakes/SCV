/**
 * Tests for Wedding Domain Service
 *
 * Testing behavior, not implementation:
 * - Users can create weddings
 * - Users cannot create duplicate weddings
 */

// Must mock before importing the service
jest.mock('server/domains/wedding/wedding.repository')
jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

import {
  mockCreate,
  mockExistsForUser,
  mockFindById,
  mockFindByOrganizationId,
  mockFindByUserId,
  mockUpdate,
  mockWedding,
  resetMocks as resetWeddingMocks,
  WeddingRepository,
} from 'server/domains/wedding/wedding.repository'
import { WeddingService } from 'server/domains/wedding/wedding.service'
import { requirePermission } from '~/server/authz/permission-checker'
import { ForbiddenError, ValidationError } from '~/server/domains/shared/domain-error'

// Create typed aliases for mock functions
const mockCreateFn = mockCreate as jest.Mock
const mockExistsForUserFn = mockExistsForUser as jest.Mock
const _mockFindByIdFn = mockFindById as jest.Mock
const mockFindByOrganizationIdFn = mockFindByOrganizationId as jest.Mock
const mockFindByUserIdFn = mockFindByUserId as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock
const mockRequirePermission = requirePermission as jest.Mock

describe('WeddingService', () => {
  let weddingService: WeddingService
  const actorContext = {
    userId: 'actor-1',
    activeOrganization: null,
  }

  beforeEach(() => {
    resetWeddingMocks()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-123', role: 'owner' })
    const mockRepository = new WeddingRepository({})
    weddingService = new WeddingService(mockRepository)
  })

  describe('createWedding', () => {
    it('should create wedding with couple names and the tasks add-on', async () => {
      mockExistsForUserFn.mockResolvedValue(false)
      mockCreateFn.mockResolvedValue(mockWedding)

      const result = await weddingService.createWedding('user-123', {
        userId: 'user-123',
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
      })

      expect(result).toEqual(mockWedding)
      expect(mockCreateFn).toHaveBeenCalledWith({
        userId: 'user-123',
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
        enabledAddOns: ['tasks'],
      })
    })

    it('should prevent creating duplicate wedding for same user', async () => {
      mockExistsForUserFn.mockResolvedValue(true)

      await expect(
        weddingService.createWedding('user-123', {
          userId: 'user-123',
          groomFirstName: 'John',
          groomLastName: 'Doe',
          brideFirstName: 'Jane',
          brideLastName: 'Smith',
        })
      ).rejects.toBeInstanceOf(ValidationError)

      expect(mockCreateFn).not.toHaveBeenCalled()
    })
  })

  describe('getByUserId', () => {
    it('should return wedding for valid userId', async () => {
      mockFindByUserIdFn.mockResolvedValue(mockWedding)

      const result = await weddingService.getByUserId('user-123')

      expect(result).toEqual(mockWedding)
      expect(mockFindByUserIdFn).toHaveBeenCalledWith('user-123')
    })

    it('should return null when userId is null', async () => {
      const result = await weddingService.getByUserId(null)

      expect(result).toBeNull()
      expect(mockFindByUserIdFn).not.toHaveBeenCalled()
    })

    it('should return null when wedding does not exist', async () => {
      mockFindByUserIdFn.mockResolvedValue(null)

      const result = await weddingService.getByUserId('user-123')

      expect(result).toBeNull()
    })
  })

  describe('updateWedding', () => {
    it('should update wedding when permission check passes', async () => {
      const updatedWedding = { ...mockWedding, groomFirstName: 'Updated' }
      mockUpdateFn.mockResolvedValue(updatedWedding)

      const result = await weddingService.updateWedding({
        ctx: actorContext,
        weddingId: 'wedding-123',
        data: { groomFirstName: 'Updated' },
      })

      expect(result.groomFirstName).toBe('Updated')
      expect(mockUpdateFn).toHaveBeenCalledWith('wedding-123', { groomFirstName: 'Updated' })
    })

    it('should reject update when permission check fails', async () => {
      mockRequirePermission.mockImplementation(() => {
        throw new ForbiddenError()
      })

      await expect(
        weddingService.updateWedding({
          ctx: actorContext,
          weddingId: 'wedding-123',
          data: { groomFirstName: 'Updated' },
        })
      ).rejects.toMatchObject({ kind: 'FORBIDDEN' })

      expect(mockUpdateFn).not.toHaveBeenCalled()
    })
  })

  describe('toggleAddOn', () => {
    it('adds a missing add-on', async () => {
      mockFindById.mockResolvedValue(mockWedding)
      mockUpdateFn.mockResolvedValue({
        ...mockWedding,
        enabledAddOns: ['website_builder'],
      })

      const result = await weddingService.toggleAddOn({
        ctx: actorContext,
        weddingId: 'wedding-123',
        addOn: 'website_builder',
        enabled: true,
      })

      expect(result.enabledAddOns).toEqual(['website_builder'])
      expect(mockUpdateFn).toHaveBeenCalledWith('wedding-123', {
        enabledAddOns: ['website_builder'],
      })
    })

    it('does not duplicate an existing add-on', async () => {
      mockFindById.mockResolvedValue({
        ...mockWedding,
        enabledAddOns: ['website_builder'],
      })
      mockUpdateFn.mockResolvedValue({
        ...mockWedding,
        enabledAddOns: ['website_builder'],
      })

      await weddingService.toggleAddOn({
        ctx: actorContext,
        weddingId: 'wedding-123',
        addOn: 'website_builder',
        enabled: true,
      })

      expect(mockUpdateFn).toHaveBeenCalledWith('wedding-123', {
        enabledAddOns: ['website_builder'],
      })
    })

    it('removes an enabled add-on', async () => {
      mockFindById.mockResolvedValue({
        ...mockWedding,
        enabledAddOns: ['website_builder', 'tasks'],
      })
      mockUpdateFn.mockResolvedValue({
        ...mockWedding,
        enabledAddOns: ['tasks'],
      })

      const result = await weddingService.toggleAddOn({
        ctx: actorContext,
        weddingId: 'wedding-123',
        addOn: 'website_builder',
        enabled: false,
      })

      expect(result.enabledAddOns).toEqual(['tasks'])
      expect(mockUpdateFn).toHaveBeenCalledWith('wedding-123', {
        enabledAddOns: ['tasks'],
      })
    })
  })

  describe('hasWedding', () => {
    it('should return true when user has wedding', async () => {
      mockExistsForUserFn.mockResolvedValue(true)

      const result = await weddingService.hasWedding('user-123')

      expect(result).toBe(true)
    })

    it('should return false when user has no wedding', async () => {
      mockExistsForUserFn.mockResolvedValue(false)

      const result = await weddingService.hasWedding('user-123')

      expect(result).toBe(false)
    })
  })

  describe('getWeddingIdByUserId', () => {
    it('returns the wedding linked to the active organization when provided', async () => {
      const scopedWedding = { ...mockWedding, id: 'wedding-org-123', organizationId: 'org-789' }
      mockFindByOrganizationIdFn.mockResolvedValue(scopedWedding)

      const result = await weddingService.getWeddingIdByUserId('user-123', 'org-789')

      expect(result).toBe('wedding-org-123')
      expect(mockFindByOrganizationIdFn).toHaveBeenCalledWith('org-789')
      expect(mockFindByUserIdFn).not.toHaveBeenCalled()
    })

    it('throws PRECONDITION_FAILED when no active organization is provided', async () => {
      await expect(weddingService.getWeddingIdByUserId('user-123')).rejects.toMatchObject({
        kind: 'PRECONDITION_FAILED',
      })
      expect(mockFindByUserIdFn).not.toHaveBeenCalled()
    })

    it('throws PRECONDITION_FAILED when active organization has no linked wedding', async () => {
      mockFindByOrganizationIdFn.mockResolvedValue(null)

      await expect(
        weddingService.getWeddingIdByUserId('user-123', 'org-orphan')
      ).rejects.toMatchObject({
        kind: 'PRECONDITION_FAILED',
      })
    })
  })
})
