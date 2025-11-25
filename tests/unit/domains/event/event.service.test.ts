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
  mockBelongsToUser,
  mockCreate,
  mockDelete,
  mockEvent,
  mockFindById,
  mockFindByUserId,
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
  resetMocks as resetDbMocks,
} from '~/server/infrastructure/database/client'

// Create typed aliases for mocked functions
const mockCreateFn = mockCreate as jest.Mock
const mockFindByIdFn = mockFindById as jest.Mock
const mockFindByUserIdFn = mockFindByUserId as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock
const mockUpdateCollectRsvpFn = mockUpdateCollectRsvp as jest.Mock
const mockDeleteFn = mockDelete as jest.Mock
const mockBelongsToUserFn = mockBelongsToUser as jest.Mock
const mockGuestFindManyFn = mockGuestFindMany as jest.Mock
const mockInvitationCreateFn = mockInvitationCreate as jest.Mock

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

      const result = await eventService.createEvent('user-123', {
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
        userId: 'user-123',
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

      await eventService.createEvent('user-123', {
        eventName: 'Wedding Day',
      })

      expect(mockInvitationCreateFn).toHaveBeenCalledTimes(2)
    })

    it('should handle event with only name', async () => {
      mockCreateFn.mockResolvedValue({ ...mockEvent, date: null })

      await eventService.createEvent('user-123', {
        eventName: 'Simple Event',
      })

      expect(mockCreateFn).toHaveBeenCalledWith({
        name: 'Simple Event',
        userId: 'user-123',
        date: undefined,
        startTime: undefined,
        endTime: undefined,
        venue: undefined,
        attire: undefined,
        description: undefined,
      })
    })
  })

  describe('getUserEvents', () => {
    it('should return events for valid userId', async () => {
      mockFindByUserIdFn.mockResolvedValue([mockEvent])

      const result = await eventService.getUserEvents('user-123')

      expect(result).toEqual([mockEvent])
      expect(mockFindByUserIdFn).toHaveBeenCalledWith('user-123')
    })

    it('should return undefined when userId is null', async () => {
      const result = await eventService.getUserEvents(null)

      expect(result).toBeUndefined()
      expect(mockFindByUserIdFn).not.toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('should return event when user owns it', async () => {
      mockFindByIdFn.mockResolvedValue(mockEvent)

      const result = await eventService.getById('event-123', 'user-123')

      expect(result).toEqual(mockEvent)
    })

    it('should throw NOT_FOUND when event does not exist', async () => {
      mockFindByIdFn.mockResolvedValue(null)

      await expect(eventService.getById('event-123', 'user-123')).rejects.toThrow(TRPCError)
      await expect(eventService.getById('event-123', 'user-123')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('should throw FORBIDDEN when user does not own event', async () => {
      mockFindByIdFn.mockResolvedValue(mockEvent)

      await expect(eventService.getById('event-123', 'other-user')).rejects.toThrow(TRPCError)
      await expect(eventService.getById('event-123', 'other-user')).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })
  })

  describe('updateEvent', () => {
    it('should update event when user owns it', async () => {
      const updatedEvent = { ...mockEvent, name: 'Updated Event' }
      mockBelongsToUserFn.mockResolvedValue(true)
      mockUpdateFn.mockResolvedValue(updatedEvent)

      const result = await eventService.updateEvent('user-123', {
        eventId: 'event-123',
        eventName: 'Updated Event',
      })

      expect(result.name).toBe('Updated Event')
    })

    it('should throw FORBIDDEN when user does not own event', async () => {
      mockBelongsToUserFn.mockResolvedValue(false)

      await expect(
        eventService.updateEvent('user-123', {
          eventId: 'event-123',
          eventName: 'Test',
        })
      ).rejects.toThrow(TRPCError)
      await expect(
        eventService.updateEvent('user-123', {
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
    it('should delete event when user owns it', async () => {
      mockBelongsToUserFn.mockResolvedValue(true)
      mockDeleteFn.mockResolvedValue(mockEvent)

      const result = await eventService.deleteEvent('event-123', 'user-123')

      expect(result).toBe('event-123')
      expect(mockDeleteFn).toHaveBeenCalledWith('event-123')
    })

    it('should throw FORBIDDEN when user does not own event', async () => {
      mockBelongsToUserFn.mockResolvedValue(false)

      await expect(eventService.deleteEvent('event-123', 'other-user')).rejects.toThrow(TRPCError)
      await expect(eventService.deleteEvent('event-123', 'other-user')).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })
  })
})
