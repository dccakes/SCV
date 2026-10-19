/**
 * Tests for Event Domain Service
 */

// Must mock before importing the service
jest.mock('server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))
jest.mock('server/domains/event/event.repository')

import { requirePermission } from 'server/authz/permission-checker'
// @ts-expect-error - Importing mock functions from mocked module
import {
  EventRepository,
  mockBelongsToWedding,
  mockDelete,
  mockEvent,
  mockEventWithStats,
  mockFindById,
  mockFindByWeddingId,
  mockFindByWeddingIdWithStats,
  mockUpdateCollectRsvp,
  resetMocks as resetEventMocks,
} from 'server/domains/event/event.repository'
import { EventService } from 'server/domains/event/event.service'
import { DomainError, ForbiddenError } from '~/server/domains/shared/domain-error'

// Create typed aliases for mocked functions
const mockBelongsToWeddingFn = mockBelongsToWedding as jest.Mock
const mockFindByIdFn = mockFindById as jest.Mock
const mockFindByWeddingIdFn = mockFindByWeddingId as jest.Mock
const mockFindByWeddingIdWithStatsFn = mockFindByWeddingIdWithStats as jest.Mock
const mockUpdateCollectRsvpFn = mockUpdateCollectRsvp as jest.Mock
const mockDeleteFn = mockDelete as jest.Mock
const mockRequirePermission = requirePermission as jest.Mock

const actorContext = {
  userId: 'user-123',
  activeOrganization: {
    organizationId: 'org-123',
    role: 'owner',
  },
}

describe('EventService', () => {
  let eventService: EventService

  beforeEach(() => {
    resetEventMocks()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-123', role: 'owner' })
    const mockRepository = new EventRepository({})
    // Set default mock returns
    eventService = new EventService(mockRepository)
  })

  describe('getWeddingEvents', () => {
    it('should return events for valid weddingId', async () => {
      mockFindByWeddingIdFn.mockResolvedValue([mockEvent])

      const result = await eventService.getWeddingEvents('wedding-123')

      expect(result).toEqual([mockEvent])
      expect(mockFindByWeddingIdFn).toHaveBeenCalledWith('wedding-123')
    })

    it('should return undefined when weddingId is null', async () => {
      const result = await eventService.getWeddingEvents(null)

      expect(result).toBeUndefined()
      expect(mockFindByWeddingIdFn).not.toHaveBeenCalled()
    })
  })

  describe('getWeddingEventsWithStats', () => {
    it('should return events with RSVP statistics for valid weddingId', async () => {
      mockFindByWeddingIdWithStatsFn.mockResolvedValue([mockEventWithStats])

      const result = await eventService.getWeddingEventsWithStats('wedding-123')

      expect(result).toEqual([mockEventWithStats])
      expect(mockFindByWeddingIdWithStatsFn).toHaveBeenCalledWith('wedding-123')
    })

    it('should return events with correct RSVP counts', async () => {
      mockFindByWeddingIdWithStatsFn.mockResolvedValue([mockEventWithStats])

      const result = await eventService.getWeddingEventsWithStats('wedding-123')

      expect(result).toHaveLength(1)
      expect(result?.[0]?.guestResponses).toEqual({
        attending: 5,
        invited: 8,
        declined: 2,
        notInvited: 3,
      })
    })

    it('should return undefined when weddingId is null', async () => {
      const result = await eventService.getWeddingEventsWithStats(null)

      expect(result).toBeUndefined()
      expect(mockFindByWeddingIdWithStatsFn).not.toHaveBeenCalled()
    })

    it('should handle multiple events with different RSVP statistics', async () => {
      const multipleEventsWithStats = [
        mockEventWithStats,
        {
          ...mockEvent,
          id: 'event-456',
          name: 'Reception',
          guestResponses: {
            attending: 10,
            invited: 5,
            declined: 1,
            notInvited: 0,
          },
        },
      ]
      mockFindByWeddingIdWithStatsFn.mockResolvedValue(multipleEventsWithStats)

      const result = await eventService.getWeddingEventsWithStats('wedding-123')

      expect(result).toHaveLength(2)
      expect(result?.[0]?.guestResponses.attending).toBe(5)
      expect(result?.[1]?.guestResponses.attending).toBe(10)
    })
  })

  describe('getById', () => {
    it('should return event when wedding owns it', async () => {
      mockFindByIdFn.mockResolvedValue(mockEvent)

      const result = await eventService.getById('event-123', 'wedding-123')

      expect(result).toEqual(mockEvent)
    })

    it('should throw NOT_FOUND when event does not exist', async () => {
      mockFindByIdFn.mockResolvedValue(null)

      await expect(eventService.getById('event-123', 'wedding-123')).rejects.toThrow(DomainError)
      await expect(eventService.getById('event-123', 'wedding-123')).rejects.toMatchObject({
        kind: 'NOT_FOUND',
      })
    })

    it('should throw FORBIDDEN when wedding does not own event', async () => {
      mockFindByIdFn.mockResolvedValue(mockEvent)

      await expect(eventService.getById('event-123', 'other-wedding')).rejects.toThrow(DomainError)
      await expect(eventService.getById('event-123', 'other-wedding')).rejects.toMatchObject({
        kind: 'FORBIDDEN',
      })
    })
  })

  describe('updateCollectRsvp', () => {
    it('should update collectRsvp status', async () => {
      const updatedEvent = { ...mockEvent, collectRsvp: false }
      mockUpdateCollectRsvpFn.mockResolvedValue(updatedEvent)
      mockBelongsToWeddingFn.mockResolvedValue(true)

      const result = await eventService.updateCollectRsvp(
        actorContext,
        'wedding-123',
        'event-123',
        false
      )

      expect(result.collectRsvp).toBe(false)
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, {
        event: ['rsvp_policy_update'],
      })
      expect(mockUpdateCollectRsvpFn).toHaveBeenCalledWith('event-123', false)
    })

    it('should reject when event does not belong to wedding', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        eventService.updateCollectRsvp(actorContext, 'wedding-123', 'event-123', false)
      ).rejects.toMatchObject({ kind: 'FORBIDDEN' })

      expect(mockUpdateCollectRsvpFn).not.toHaveBeenCalled()
    })

    it('should reject update collect RSVP when actor lacks permission', async () => {
      mockRequirePermission.mockImplementation(() => {
        throw new ForbiddenError()
      })

      await expect(
        eventService.updateCollectRsvp(actorContext, 'wedding-123', 'event-123', false)
      ).rejects.toMatchObject({ kind: 'FORBIDDEN' })

      expect(mockUpdateCollectRsvpFn).not.toHaveBeenCalled()
    })
  })

  describe('deleteEvent', () => {
    it('should delete event when wedding owns it', async () => {
      mockDeleteFn.mockResolvedValue(mockEvent)
      mockBelongsToWeddingFn.mockResolvedValue(true)

      const result = await eventService.deleteEvent(actorContext, 'wedding-123', 'event-123')

      expect(result).toBe('event-123')
      expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, {
        event: ['delete'],
      })
      expect(mockDeleteFn).toHaveBeenCalledWith('event-123')
    })

    it('should reject when event does not belong to wedding', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        eventService.deleteEvent(actorContext, 'wedding-123', 'event-123')
      ).rejects.toMatchObject({ kind: 'FORBIDDEN' })

      expect(mockDeleteFn).not.toHaveBeenCalled()
    })

    it('should reject delete when actor lacks event delete permission', async () => {
      mockRequirePermission.mockImplementation(() => {
        throw new ForbiddenError()
      })

      await expect(
        eventService.deleteEvent(actorContext, 'wedding-123', 'event-123')
      ).rejects.toMatchObject({
        kind: 'FORBIDDEN',
      })
    })
  })
})
