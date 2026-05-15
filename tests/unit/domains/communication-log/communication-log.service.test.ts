/**
 * Tests for Communication Log Domain Service
 *
 * Covers:
 * - Timeline assembly from notes, invitations, and gifts
 * - Wedding-scoped authorization on reads
 * - Manual note CRUD with authorization
 * - Timeline sorting (newest first)
 */

import { TRPCError } from '@trpc/server'

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

import { requirePermission } from '~/server/authz/permission-checker'
import { CommunicationLogService } from '~/server/domains/communication-log/communication-log.service'

const mockRequirePermission = requirePermission as jest.Mock

// Mock repository
const mockFindByHouseholdId = jest.fn()
const mockCreate = jest.fn()
const mockDelete = jest.fn()
const mockBelongsToWedding = jest.fn()

const mockRepository = {
  findByHouseholdId: mockFindByHouseholdId,
  create: mockCreate,
  delete: mockDelete,
  belongsToWedding: mockBelongsToWedding,
}

// Mock PrismaClient
const mockHouseholdFindFirst = jest.fn()
const mockInvitationFindMany = jest.fn()
const mockGiftFindMany = jest.fn()

const mockDb = {
  household: { findFirst: mockHouseholdFindFirst },
  invitation: { findMany: mockInvitationFindMany },
  gift: { findMany: mockGiftFindMany },
}

const actorContext = {
  userId: 'actor-1',
  activeOrganization: { organizationId: 'org-1', role: 'owner' },
}

describe('CommunicationLogService', () => {
  let service: CommunicationLogService

  beforeEach(() => {
    jest.resetAllMocks()
    mockRequirePermission.mockReturnValue(undefined)
    service = new CommunicationLogService(mockRepository as never, mockDb as never)
  })

  describe('getTimelineForHousehold', () => {
    it('rejects if household does not belong to wedding', async () => {
      mockHouseholdFindFirst.mockResolvedValue(null)

      await expect(
        service.getTimelineForHousehold(actorContext, 'wedding-1', 'household-wrong')
      ).rejects.toThrow(TRPCError)

      await expect(
        service.getTimelineForHousehold(actorContext, 'wedding-1', 'household-wrong')
      ).rejects.toThrow('Household does not belong to your wedding')
    })

    it('returns empty array when household has no activity', async () => {
      mockHouseholdFindFirst.mockResolvedValue({ id: 'household-1' })
      mockFindByHouseholdId.mockResolvedValue([])
      mockInvitationFindMany.mockResolvedValue([])
      mockGiftFindMany.mockResolvedValue([])

      const result = await service.getTimelineForHousehold(actorContext, 'wedding-1', 'household-1')

      expect(result).toEqual([])
    })

    it('merges notes, invitations, RSVPs, and thank-yous into a sorted timeline', async () => {
      mockHouseholdFindFirst.mockResolvedValue({ id: 'household-1' })

      // Note created at day 3
      mockFindByHouseholdId.mockResolvedValue([
        {
          id: 'note-1',
          householdId: 'household-1',
          weddingId: 'wedding-1',
          message: 'Called to follow up',
          actorType: 'couple',
          createdAt: new Date('2026-01-03'),
        },
      ])

      // Invitation sent day 1, RSVP received day 4
      mockInvitationFindMany.mockResolvedValue([
        {
          eventId: 'event-1',
          rsvp: 'Attending',
          invitedAt: new Date('2026-01-01'),
          submittedAt: new Date('2026-01-04'),
          event: { name: 'Reception' },
          guest: { firstName: 'John', lastName: 'Smith' },
        },
      ])

      // Thank you sent day 5
      mockGiftFindMany.mockResolvedValue([
        {
          eventId: 'event-1',
          thankYouSentAt: new Date('2026-01-05'),
          event: { name: 'Reception' },
        },
      ])

      const result = await service.getTimelineForHousehold(actorContext, 'wedding-1', 'household-1')

      expect(result).toHaveLength(4)

      // Sorted newest first
      expect(result[0].type).toBe('THANK_YOU_SENT')
      expect(result[1].type).toBe('RSVP_RECEIVED')
      expect(result[2].type).toBe('NOTE')
      expect(result[3].type).toBe('INVITATION_SENT')
    })

    it('includes RSVP_RECEIVED only when submittedAt is set', async () => {
      mockHouseholdFindFirst.mockResolvedValue({ id: 'household-1' })
      mockFindByHouseholdId.mockResolvedValue([])
      mockGiftFindMany.mockResolvedValue([])

      // Invitation without RSVP submission
      mockInvitationFindMany.mockResolvedValue([
        {
          eventId: 'event-1',
          rsvp: 'Invited',
          invitedAt: new Date('2026-01-01'),
          submittedAt: null,
          event: { name: 'Ceremony' },
          guest: { firstName: 'Jane', lastName: 'Doe' },
        },
      ])

      const result = await service.getTimelineForHousehold(actorContext, 'wedding-1', 'household-1')

      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('INVITATION_SENT')
    })

    it('formats RSVP_RECEIVED message with guest name and status', async () => {
      mockHouseholdFindFirst.mockResolvedValue({ id: 'household-1' })
      mockFindByHouseholdId.mockResolvedValue([])
      mockGiftFindMany.mockResolvedValue([])

      mockInvitationFindMany.mockResolvedValue([
        {
          eventId: 'event-1',
          rsvp: 'Declined',
          invitedAt: new Date('2026-01-01'),
          submittedAt: new Date('2026-01-02'),
          event: { name: 'Reception' },
          guest: { firstName: 'Bob', lastName: 'Jones' },
        },
      ])

      const result = await service.getTimelineForHousehold(actorContext, 'wedding-1', 'household-1')

      const rsvpEntry = result.find((e) => e.type === 'RSVP_RECEIVED')
      expect(rsvpEntry).toBeDefined()
      if (!rsvpEntry) {
        throw new Error('Expected RSVP_RECEIVED timeline entry')
      }
      expect(rsvpEntry.message).toBe("Bob Jones RSVP'd Declined for Reception")
    })

    it('checks guest:view permission', async () => {
      mockHouseholdFindFirst.mockResolvedValue({ id: 'household-1' })
      mockFindByHouseholdId.mockResolvedValue([])
      mockInvitationFindMany.mockResolvedValue([])
      mockGiftFindMany.mockResolvedValue([])

      await service.getTimelineForHousehold(actorContext, 'wedding-1', 'household-1')

      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { guest: ['read'] })
    })
  })

  describe('addNote', () => {
    it('creates a note with couple actorType', async () => {
      const mockNote = {
        id: 'note-1',
        householdId: 'household-1',
        weddingId: 'wedding-1',
        message: 'Spoke with Sarah about +1',
        actorType: 'couple' as const,
        createdAt: new Date(),
      }
      mockCreate.mockResolvedValue(mockNote)

      const result = await service.addNote(
        actorContext,
        'wedding-1',
        'household-1',
        'Spoke with Sarah about +1'
      )

      expect(result).toEqual(mockNote)
      expect(mockCreate).toHaveBeenCalledWith({
        householdId: 'household-1',
        weddingId: 'wedding-1',
        message: 'Spoke with Sarah about +1',
        actorType: 'couple',
      })
    })

    it('checks guest:update permission', async () => {
      mockCreate.mockResolvedValue({})

      await service.addNote(actorContext, 'wedding-1', 'household-1', 'test')

      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { guest: ['update'] })
    })
  })

  describe('deleteNote', () => {
    it('deletes a note that belongs to the wedding', async () => {
      const mockNote = {
        id: 'note-1',
        householdId: 'household-1',
        weddingId: 'wedding-1',
        message: 'Old note',
        actorType: 'couple' as const,
        createdAt: new Date(),
      }
      mockBelongsToWedding.mockResolvedValue(true)
      mockDelete.mockResolvedValue(mockNote)

      const result = await service.deleteNote(actorContext, 'wedding-1', 'note-1')

      expect(result).toEqual(mockNote)
      expect(mockBelongsToWedding).toHaveBeenCalledWith('note-1', 'wedding-1')
      expect(mockDelete).toHaveBeenCalledWith('note-1')
    })

    it('rejects deletion when note does not belong to wedding', async () => {
      mockBelongsToWedding.mockResolvedValue(false)

      await expect(service.deleteNote(actorContext, 'wedding-1', 'note-wrong')).rejects.toThrow(
        TRPCError
      )

      expect(mockDelete).not.toHaveBeenCalled()
    })

    it('checks guest:update permission', async () => {
      mockBelongsToWedding.mockResolvedValue(true)
      mockDelete.mockResolvedValue({})

      await service.deleteNote(actorContext, 'wedding-1', 'note-1')

      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { guest: ['update'] })
    })
  })
})
