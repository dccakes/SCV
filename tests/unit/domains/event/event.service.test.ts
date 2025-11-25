/**
 * Tests for Event Domain Service
 */

import { TRPCError } from '@trpc/server'

import { EventService } from '~/server/domains/event/event.service'
import { type EventRepository } from '~/server/domains/event/event.repository'
import { type Event } from '~/server/domains/event/event.types'

// Mock event data
const mockEvent: Event = {
  id: 'event-123',
  name: 'Wedding Day',
  date: new Date('2024-06-15'),
  startTime: '14:00',
  endTime: '16:00',
  venue: 'Beautiful Garden',
  attire: 'Formal',
  description: 'Our special day!',
  userId: 'user-123',
  collectRsvp: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

// Mock repository
const createMockRepository = (): jest.Mocked<EventRepository> => ({
  findById: jest.fn(),
  findByIdWithQuestions: jest.fn(),
  findByUserId: jest.fn(),
  findByUserIdWithQuestions: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateCollectRsvp: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  belongsToUser: jest.fn(),
})

// Mock Prisma client
const createMockDb = () => ({
  guest: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  invitation: {
    create: jest.fn(),
  },
})

describe('EventService', () => {
  let eventService: EventService
  let mockRepository: jest.Mocked<EventRepository>
  let mockDb: ReturnType<typeof createMockDb>

  beforeEach(() => {
    mockRepository = createMockRepository()
    mockDb = createMockDb()
    eventService = new EventService(mockRepository, mockDb as any)
  })

  describe('createEvent', () => {
    it('should create an event successfully', async () => {
      mockRepository.create.mockResolvedValue(mockEvent)

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
      expect(mockRepository.create).toHaveBeenCalledWith({
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
      mockRepository.create.mockResolvedValue(mockEvent)
      mockDb.guest.findMany.mockResolvedValue([
        { id: 1, firstName: 'Guest', lastName: 'One', userId: 'user-123' },
        { id: 2, firstName: 'Guest', lastName: 'Two', userId: 'user-123' },
      ])

      await eventService.createEvent('user-123', {
        eventName: 'Wedding Day',
      })

      expect(mockDb.invitation.create).toHaveBeenCalledTimes(2)
    })

    it('should handle event with only name', async () => {
      mockRepository.create.mockResolvedValue({ ...mockEvent, date: null })

      await eventService.createEvent('user-123', {
        eventName: 'Simple Event',
      })

      expect(mockRepository.create).toHaveBeenCalledWith({
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
      mockRepository.findByUserId.mockResolvedValue([mockEvent])

      const result = await eventService.getUserEvents('user-123')

      expect(result).toEqual([mockEvent])
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123')
    })

    it('should return undefined when userId is null', async () => {
      const result = await eventService.getUserEvents(null)

      expect(result).toBeUndefined()
      expect(mockRepository.findByUserId).not.toHaveBeenCalled()
    })
  })

  describe('getById', () => {
    it('should return event when user owns it', async () => {
      mockRepository.findById.mockResolvedValue(mockEvent)

      const result = await eventService.getById('event-123', 'user-123')

      expect(result).toEqual(mockEvent)
    })

    it('should throw NOT_FOUND when event does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(eventService.getById('event-123', 'user-123')).rejects.toThrow(TRPCError)

      try {
        await eventService.getById('event-123', 'user-123')
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('NOT_FOUND')
      }
    })

    it('should throw FORBIDDEN when user does not own event', async () => {
      mockRepository.findById.mockResolvedValue(mockEvent)

      await expect(eventService.getById('event-123', 'other-user')).rejects.toThrow(TRPCError)

      try {
        await eventService.getById('event-123', 'other-user')
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('FORBIDDEN')
      }
    })
  })

  describe('updateEvent', () => {
    it('should update event when user owns it', async () => {
      const updatedEvent = { ...mockEvent, name: 'Updated Event' }
      mockRepository.belongsToUser.mockResolvedValue(true)
      mockRepository.update.mockResolvedValue(updatedEvent)

      const result = await eventService.updateEvent('user-123', {
        eventId: 'event-123',
        eventName: 'Updated Event',
      })

      expect(result.name).toBe('Updated Event')
    })

    it('should throw FORBIDDEN when user does not own event', async () => {
      mockRepository.belongsToUser.mockResolvedValue(false)

      await expect(
        eventService.updateEvent('user-123', {
          eventId: 'event-123',
          eventName: 'Test',
        })
      ).rejects.toThrow(TRPCError)

      try {
        await eventService.updateEvent('user-123', {
          eventId: 'event-123',
          eventName: 'Test',
        })
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('FORBIDDEN')
      }
    })
  })

  describe('updateCollectRsvp', () => {
    it('should update collectRsvp status', async () => {
      const updatedEvent = { ...mockEvent, collectRsvp: false }
      mockRepository.updateCollectRsvp.mockResolvedValue(updatedEvent)

      const result = await eventService.updateCollectRsvp('event-123', false)

      expect(result.collectRsvp).toBe(false)
      expect(mockRepository.updateCollectRsvp).toHaveBeenCalledWith('event-123', false)
    })
  })

  describe('deleteEvent', () => {
    it('should delete event when user owns it', async () => {
      mockRepository.belongsToUser.mockResolvedValue(true)
      mockRepository.delete.mockResolvedValue(mockEvent)

      const result = await eventService.deleteEvent('event-123', 'user-123')

      expect(result).toBe('event-123')
      expect(mockRepository.delete).toHaveBeenCalledWith('event-123')
    })

    it('should throw FORBIDDEN when user does not own event', async () => {
      mockRepository.belongsToUser.mockResolvedValue(false)

      await expect(eventService.deleteEvent('event-123', 'other-user')).rejects.toThrow(TRPCError)

      try {
        await eventService.deleteEvent('event-123', 'other-user')
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('FORBIDDEN')
      }
    })
  })
})
