/**
 * Tests for Wedding Domain Service
 *
 * Testing behavior, not implementation:
 * - Users can create weddings
 * - Users cannot create duplicate weddings
 * - Wedding creation with details creates default event
 * - User profile is updated with couple info
 */

import { TRPCError } from '@trpc/server'

// Must mock before importing the service
jest.mock('server/domains/wedding/wedding.repository')
jest.mock('server/domains/event/event.service')
jest.mock('server/domains/user/user.service')
jest.mock('server/domains/guest-tag/guest-tag.service')
jest.mock('~/server/domains/checklist')
jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))
jest.mock('~/lib/etta/provision', () => ({
  provisionEtta: jest.fn().mockResolvedValue(undefined),
}))

// @ts-expect-error - Importing mock functions from mocked module
import {
  EventService,
  mockCreateEventSystem,
  resetMocks as resetEventMocks,
} from 'server/domains/event/event.service'
// @ts-expect-error - Importing mock functions from mocked module
import {
  GuestTagService,
  mockSeedInitialTags,
  resetMocks as resetTagMocks,
} from 'server/domains/guest-tag/guest-tag.service'
// @ts-expect-error - Importing mock functions from mocked module
import { mockUpdateProfile, resetMocks as resetUserMocks } from 'server/domains/user/user.service'
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
import { mockEnsureSeeded, resetMocks as resetChecklistMocks } from '~/server/domains/checklist'

// Create typed aliases for mock functions
const mockCreateFn = mockCreate as jest.Mock
const mockExistsForUserFn = mockExistsForUser as jest.Mock
const _mockFindByIdFn = mockFindById as jest.Mock
const mockFindByOrganizationIdFn = mockFindByOrganizationId as jest.Mock
const mockFindByUserIdFn = mockFindByUserId as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock
const mockCreateEventFn = mockCreateEventSystem as jest.Mock
const mockUpdateProfileFn = mockUpdateProfile as jest.Mock
const mockSeedInitialTagsFn = mockSeedInitialTags as jest.Mock
const mockEnsureSeededFn = mockEnsureSeeded as jest.Mock
const mockRequirePermission = requirePermission as jest.Mock

describe('WeddingService', () => {
  let weddingService: WeddingService
  const actorContext = {
    userId: 'actor-1',
    activeOrganization: null,
  }

  beforeEach(() => {
    resetWeddingMocks()
    resetEventMocks()
    resetUserMocks()
    resetTagMocks()
    resetChecklistMocks()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-123', role: 'owner' })
    mockEnsureSeededFn.mockResolvedValue({
      eventId: 'event-123',
      seededMilestoneCount: 13,
      seededTaskCount: 58,
      enabledAddOnsUpdated: false,
    })
    const mockRepository = new WeddingRepository({})
    const mockEventSvc = new EventService({})
    const mockGuestTagService = new GuestTagService({})
    weddingService = new WeddingService(mockRepository, mockEventSvc, mockGuestTagService)
  })

  describe('createWedding', () => {
    it('should create wedding with couple names', async () => {
      mockExistsForUserFn.mockResolvedValue(false)
      mockCreateFn.mockResolvedValue(mockWedding)
      mockSeedInitialTagsFn.mockResolvedValue(undefined)
      mockUpdateProfileFn.mockResolvedValue({})

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

    it('should seed default tags when creating wedding', async () => {
      mockExistsForUserFn.mockResolvedValue(false)
      mockCreateFn.mockResolvedValue(mockWedding)
      mockSeedInitialTagsFn.mockResolvedValue(undefined)
      mockUpdateProfileFn.mockResolvedValue({})

      await weddingService.createWedding('user-123', {
        userId: 'user-123',
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
      })

      expect(mockSeedInitialTagsFn).toHaveBeenCalledWith('wedding-123', [
        { name: 'Family', color: '#3b82f6' },
        { name: 'MutualFriends', color: '#10b981' },
        { name: 'Coworkers', color: '#8b5cf6' },
        { name: 'Plus One', color: '#f59e0b' },
      ])
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
      ).rejects.toThrow(TRPCError)

      expect(mockCreateFn).not.toHaveBeenCalled()
    })

    it('should create default "Wedding Day" event when date provided', async () => {
      const weddingDate = '2025-06-15T00:00:00.000Z'
      mockExistsForUserFn.mockResolvedValue(false)
      mockCreateFn.mockResolvedValue(mockWedding)
      mockSeedInitialTagsFn.mockResolvedValue(undefined)
      mockCreateEventFn.mockResolvedValue({
        id: 'event-123',
        name: 'Ceremony',
        date: new Date(weddingDate),
        venue: 'Beach Resort',
      })
      mockUpdateProfileFn.mockResolvedValue({})

      await weddingService.createWedding('user-123', {
        userId: 'user-123',
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
        hasWeddingDetails: true,
        weddingDate,
        weddingLocation: 'Beach Resort',
      })

      expect(mockCreateEventFn).toHaveBeenCalledWith('wedding-123', {
        eventName: 'Ceremony',
        date: weddingDate,
        venue: 'Beach Resort',
        collectRsvp: false,
        allowTagAlongs: false,
      })
      expect(mockEnsureSeededFn).toHaveBeenCalledWith('wedding-123')
    })

    it('should not create event when wedding details not provided', async () => {
      mockExistsForUserFn.mockResolvedValue(false)
      mockCreateFn.mockResolvedValue(mockWedding)
      mockSeedInitialTagsFn.mockResolvedValue(undefined)
      mockUpdateProfileFn.mockResolvedValue({})

      await weddingService.createWedding('user-123', {
        userId: 'user-123',
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
        hasWeddingDetails: false,
      })

      expect(mockCreateEventFn).not.toHaveBeenCalled()
      expect(mockEnsureSeededFn).not.toHaveBeenCalled()
    })

    it('should preserve successful wedding creation when checklist seeding fails', async () => {
      const weddingDate = '2025-06-15T00:00:00.000Z'
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockExistsForUserFn.mockResolvedValue(false)
      mockCreateFn.mockResolvedValue(mockWedding)
      mockSeedInitialTagsFn.mockResolvedValue(undefined)
      mockCreateEventFn.mockResolvedValue({
        id: 'event-123',
        name: 'Ceremony',
        date: new Date(weddingDate),
        venue: 'Beach Resort',
      })
      mockEnsureSeededFn.mockRejectedValue(new Error('seed failed'))

      await expect(
        weddingService.createWedding('user-123', {
          userId: 'user-123',
          groomFirstName: 'John',
          groomLastName: 'Doe',
          brideFirstName: 'Jane',
          brideLastName: 'Smith',
          hasWeddingDetails: true,
          weddingDate,
          weddingLocation: 'Beach Resort',
        })
      ).resolves.toEqual(mockWedding)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Checklist] Wedding create seeding failed:',
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
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
        throw new TRPCError({ code: 'FORBIDDEN' })
      })

      await expect(
        weddingService.updateWedding({
          ctx: actorContext,
          weddingId: 'wedding-123',
          data: { groomFirstName: 'Updated' },
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })

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
        code: 'PRECONDITION_FAILED',
      })
      expect(mockFindByUserIdFn).not.toHaveBeenCalled()
    })

    it('throws PRECONDITION_FAILED when active organization has no linked wedding', async () => {
      mockFindByOrganizationIdFn.mockResolvedValue(null)

      await expect(
        weddingService.getWeddingIdByUserId('user-123', 'org-orphan')
      ).rejects.toMatchObject({
        code: 'PRECONDITION_FAILED',
      })
    })
  })
})
