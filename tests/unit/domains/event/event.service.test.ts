/**
 * Tests for Event Domain Service
 */

import { TRPCError } from '@trpc/server'

// Must mock before importing the service
jest.mock('~/server/domains/event/event.repository')
jest.mock('~/server/infrastructure/database/client')

// @ts-expect-error - Importing mock functions from mocked module
import {
  EventRepository,
  mockBelongsToWedding,
  mockCreate,
  mockDelete,
  mockEvent,
  mockEventWithStats,
  mockFindById,
  mockFindByWeddingId,
  mockFindByWeddingIdWithStats,
  mockGuests,
  mockUpdate,
  mockUpdateCollectRsvp,
  resetMocks as resetEventMocks,
} from '~/server/domains/event/event.repository'
import { EventService } from '~/server/domains/event/event.service'
// @ts-expect-error - Importing mock functions from mocked module
import {
  db,
  mockGuestFindMany,
  mockInvitationCreate,
  mockInvitationDeleteMany,
  resetMocks as resetDbMocks,
} from '~/server/infrastructure/database/client'

// Create typed aliases for mocked functions
const mockCreateFn = mockCreate as jest.Mock
const mockFindByIdFn = mockFindById as jest.Mock
const mockFindByWeddingIdFn = mockFindByWeddingId as jest.Mock
const mockFindByWeddingIdWithStatsFn = mockFindByWeddingIdWithStats as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock
const mockUpdateCollectRsvpFn = mockUpdateCollectRsvp as jest.Mock
const mockDeleteFn = mockDelete as jest.Mock
const mockBelongsToWeddingFn = mockBelongsToWedding as jest.Mock
const mockGuestFindManyFn = mockGuestFindMany as jest.Mock
const mockInvitationCreateFn = mockInvitationCreate as jest.Mock
const mockInvitationDeleteManyFn = mockInvitationDeleteMany as jest.Mock

describe('EventService', () => {
  let eventService: EventService

  beforeEach(() => {
    resetEventMocks()
    resetDbMocks()
    const mockRepository = new EventRepository({})
    // Set default mock returns
    mockGuestFindManyFn.mockResolvedValue([])
    eventService = new EventService(mockRepository, db)
  })

  describe('createEvent', () => {
    it('should create an event successfully', async () => {
      mockCreateFn.mockResolvedValue(mockEvent)

      const result = await eventService.createEvent('wedding-123', {
        eventName: 'Wedding Day',
        date: '2024-06-15',
        startTime: '14:00',
        endTime: '16:00',
        venue: 'Beautiful Garden',
        attire: 'Formal',
        description: 'Our special day!',
      })

      expect(result).toEqual(mockEvent)
      expect(mockCreateFn).toHaveBeenCalledWith({
        name: 'Wedding Day',
        weddingId: 'wedding-123',
        date: expect.any(Date),
        startTime: '14:00',
        endTime: '16:00',
        venue: 'Beautiful Garden',
        attire: 'Formal',
        description: 'Our special day!',
      })
    })

    it('should create invitations for existing guests', async () => {
      mockCreateFn.mockResolvedValue(mockEvent)
      mockGuestFindManyFn.mockResolvedValue(mockGuests)

      await eventService.createEvent('wedding-123', {
        eventName: 'Wedding Day',
      })

      expect(mockInvitationCreateFn).toHaveBeenCalledTimes(2)
    })

    it('should exclude tag-along guests from invitations by default', async () => {
      const allGuests = [
        {
          id: 1,
          firstName: 'Regular',
          lastName: 'Guest',
          weddingId: 'wedding-123',
          isTagAlong: false,
        },
        { id: 2, firstName: 'Tag', lastName: 'Along', weddingId: 'wedding-123', isTagAlong: true },
      ]
      mockCreateFn.mockResolvedValue(mockEvent)
      mockGuestFindManyFn.mockResolvedValue([allGuests[0]])

      await eventService.createEvent('wedding-123', {
        eventName: 'Ceremony',
      })

      // Should query excluding tag-alongs (isTagAlong: false)
      expect(mockGuestFindManyFn).toHaveBeenCalledWith({
        where: { weddingId: 'wedding-123', isTagAlong: false },
      })
      expect(mockInvitationCreateFn).toHaveBeenCalledTimes(1)
    })

    it('should include tag-along guests in invitations when allowTagAlongs is true', async () => {
      const allGuests = [
        {
          id: 1,
          firstName: 'Regular',
          lastName: 'Guest',
          weddingId: 'wedding-123',
          isTagAlong: false,
        },
        { id: 2, firstName: 'Tag', lastName: 'Along', weddingId: 'wedding-123', isTagAlong: true },
      ]
      mockCreateFn.mockResolvedValue({ ...mockEvent, allowTagAlongs: true })
      mockGuestFindManyFn.mockResolvedValue(allGuests)

      await eventService.createEvent('wedding-123', {
        eventName: 'Welcome Party',
        allowTagAlongs: true,
      })

      // Should query ALL guests (no isTagAlong filter)
      expect(mockGuestFindManyFn).toHaveBeenCalledWith({
        where: { weddingId: 'wedding-123' },
      })
      expect(mockInvitationCreateFn).toHaveBeenCalledTimes(2)
    })

    it('should handle event with only name', async () => {
      mockCreateFn.mockResolvedValue({ ...mockEvent, date: null })

      await eventService.createEvent('wedding-123', {
        eventName: 'Simple Event',
      })

      expect(mockCreateFn).toHaveBeenCalledWith({
        name: 'Simple Event',
        weddingId: 'wedding-123',
        date: undefined,
        startTime: undefined,
        endTime: undefined,
        venue: undefined,
        attire: undefined,
        description: undefined,
      })
    })
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

      await expect(eventService.getById('event-123', 'wedding-123')).rejects.toThrow(TRPCError)
      await expect(eventService.getById('event-123', 'wedding-123')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('should throw FORBIDDEN when wedding does not own event', async () => {
      mockFindByIdFn.mockResolvedValue(mockEvent)

      await expect(eventService.getById('event-123', 'other-wedding')).rejects.toThrow(TRPCError)
      await expect(eventService.getById('event-123', 'other-wedding')).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })
  })

  describe('updateEvent', () => {
    it('should update event when wedding owns it', async () => {
      const updatedEvent = { ...mockEvent, name: 'Updated Event' }
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockUpdateFn.mockResolvedValue(updatedEvent)

      const result = await eventService.updateEvent('wedding-123', {
        eventId: 'event-123',
        eventName: 'Updated Event',
      })

      expect(result.name).toBe('Updated Event')
    })

    it('should create invitations only for tag-alongs without existing ones when toggled on', async () => {
      const tagAlongGuests = [
        { id: 10, firstName: 'Baby', lastName: 'Doe', weddingId: 'wedding-123', isTagAlong: true },
        { id: 11, firstName: 'Child', lastName: 'Doe', weddingId: 'wedding-123', isTagAlong: true },
      ]
      // Current event has allowTagAlongs: false
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockFindByIdFn.mockResolvedValue({ ...mockEvent, allowTagAlongs: false })
      mockGuestFindManyFn.mockResolvedValue(tagAlongGuests)
      mockUpdateFn.mockResolvedValue({ ...mockEvent, allowTagAlongs: true })

      await eventService.updateEvent('wedding-123', {
        eventId: 'event-123',
        eventName: 'Wedding Day',
        allowTagAlongs: true,
      })

      // Should fetch only tag-along guests WITHOUT existing invitations for this event
      expect(mockGuestFindManyFn).toHaveBeenCalledWith({
        where: {
          weddingId: 'wedding-123',
          isTagAlong: true,
          invitations: { none: { eventId: 'event-123' } },
        },
      })
      // Should create invitations for each tag-along that doesn't have one
      expect(mockInvitationCreateFn).toHaveBeenCalledTimes(2)
      expect(mockInvitationCreateFn).toHaveBeenCalledWith({
        data: expect.objectContaining({
          guestId: 10,
          eventId: 'event-123',
          rsvp: 'Not Invited',
        }),
      })
    })

    it('should NOT delete tag-along invitations when toggled off (preserve RSVP data)', async () => {
      // Current event has allowTagAlongs: true
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockFindByIdFn.mockResolvedValue({ ...mockEvent, allowTagAlongs: true })
      mockUpdateFn.mockResolvedValue({ ...mockEvent, allowTagAlongs: false })

      await eventService.updateEvent('wedding-123', {
        eventId: 'event-123',
        eventName: 'Wedding Day',
        allowTagAlongs: false,
      })

      // Should NOT query for guests or delete invitations — data is preserved
      expect(mockGuestFindManyFn).not.toHaveBeenCalled()
      expect(mockInvitationDeleteManyFn).not.toHaveBeenCalled()
      // The flag update itself controls visibility in counts/display
    })

    it('should not create duplicate invitations when re-toggling on after off', async () => {
      // Scenario: event was toggled on (invitations created), toggled off (preserved),
      // now toggled on again — should not create duplicates
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockFindByIdFn.mockResolvedValue({ ...mockEvent, allowTagAlongs: false })
      // Query returns empty — all tag-alongs already have invitations from before
      mockGuestFindManyFn.mockResolvedValue([])
      mockUpdateFn.mockResolvedValue({ ...mockEvent, allowTagAlongs: true })

      await eventService.updateEvent('wedding-123', {
        eventId: 'event-123',
        eventName: 'Wedding Day',
        allowTagAlongs: true,
      })

      // Should query with invitations: { none: { eventId } } filter
      expect(mockGuestFindManyFn).toHaveBeenCalledWith({
        where: {
          weddingId: 'wedding-123',
          isTagAlong: true,
          invitations: { none: { eventId: 'event-123' } },
        },
      })
      // No guests returned = no invitations created (idempotent)
      expect(mockInvitationCreateFn).not.toHaveBeenCalled()
    })

    it('should not modify invitations when allowTagAlongs stays the same', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockFindByIdFn.mockResolvedValue({ ...mockEvent, allowTagAlongs: false })
      mockUpdateFn.mockResolvedValue(mockEvent)

      await eventService.updateEvent('wedding-123', {
        eventId: 'event-123',
        eventName: 'Wedding Day',
        allowTagAlongs: false,
      })

      // Should not touch guest queries or invitations
      expect(mockGuestFindManyFn).not.toHaveBeenCalled()
      expect(mockInvitationCreateFn).not.toHaveBeenCalled()
      expect(mockInvitationDeleteManyFn).not.toHaveBeenCalled()
    })

    it('should throw FORBIDDEN when wedding does not own event', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(
        eventService.updateEvent('wedding-123', {
          eventId: 'event-123',
          eventName: 'Test',
        })
      ).rejects.toThrow(TRPCError)
      await expect(
        eventService.updateEvent('wedding-123', {
          eventId: 'event-123',
          eventName: 'Test',
        })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })

  describe('updateCollectRsvp', () => {
    it('should update collectRsvp status', async () => {
      const updatedEvent = { ...mockEvent, collectRsvp: false }
      mockUpdateCollectRsvpFn.mockResolvedValue(updatedEvent)

      const result = await eventService.updateCollectRsvp('event-123', false)

      expect(result.collectRsvp).toBe(false)
      expect(mockUpdateCollectRsvpFn).toHaveBeenCalledWith('event-123', false)
    })
  })

  describe('deleteEvent', () => {
    it('should delete event when wedding owns it', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(true)
      mockDeleteFn.mockResolvedValue(mockEvent)

      const result = await eventService.deleteEvent('event-123', 'wedding-123')

      expect(result).toBe('event-123')
      expect(mockDeleteFn).toHaveBeenCalledWith('event-123')
    })

    it('should throw FORBIDDEN when wedding does not own event', async () => {
      mockBelongsToWeddingFn.mockResolvedValue(false)

      await expect(eventService.deleteEvent('event-123', 'other-wedding')).rejects.toThrow(
        TRPCError
      )
      await expect(eventService.deleteEvent('event-123', 'other-wedding')).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })
  })
})
