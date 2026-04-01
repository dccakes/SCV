/**
 * Tests for Wedding Domain Router - getDetails and updateDetails procedures
 *
 * Tests the new settings-related endpoints that allow users to
 * view and update their wedding details (names, date, location).
 */

// Mock heavy ESM/generated dependencies loaded transitively by trpc.ts
jest.mock('~/lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))
jest.mock('~/server/db', () => ({ db: {} }))

jest.mock('~/server/domains/wedding')
jest.mock('~/server/domains/event')

// We need to mock eventService at the module level
// @ts-expect-error - Importing mock from mocked module
import { eventService } from '~/server/domains/event'
// @ts-expect-error - Importing mock functions from mocked module
import {
  mockGetByUserId,
  mockUpdateWedding,
  mockWedding,
  resetMocks as resetWeddingMocks,
} from '~/server/domains/wedding'
import { weddingRouter } from '~/server/domains/wedding/wedding.router'

const mockGetByUserIdFn = mockGetByUserId as jest.Mock
const mockUpdateWeddingFn = mockUpdateWedding as jest.Mock
const mockGetWeddingEvents = eventService.getWeddingEvents as jest.Mock
const mockCreateEvent = eventService.createEvent as jest.Mock
const mockUpdateEvent = eventService.updateEvent as jest.Mock

// ── tRPC caller helpers ──────────────────────────────────────────────────────
function makeAuthCaller(userId = 'user-123') {
  return weddingRouter.createCaller({
    db: {} as never,
    auth: { userId, session: { user: { id: userId } } as never },
    headers: new Headers(),
  })
}

describe('weddingRouter', () => {
  beforeEach(() => {
    resetWeddingMocks()
    mockGetWeddingEvents.mockReset()
    mockCreateEvent.mockReset()
    mockUpdateEvent.mockReset()
  })

  describe('getDetails', () => {
    it('should return null when no wedding exists', async () => {
      mockGetByUserIdFn.mockResolvedValue(null)

      const caller = makeAuthCaller()
      const result = await caller.getDetails()

      expect(result).toBeNull()
    })

    it('should return wedding details with event date and location', async () => {
      mockGetByUserIdFn.mockResolvedValue(mockWedding)
      mockGetWeddingEvents.mockResolvedValue([
        {
          id: 'event-123',
          name: 'Ceremony',
          date: new Date('2025-06-15'),
          venue: 'Beach Resort',
          allowTagAlongs: false,
        },
      ])

      const caller = makeAuthCaller()
      const result = await caller.getDetails()

      expect(result).toEqual({
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
        weddingDate: new Date('2025-06-15').toISOString(),
        weddingLocation: 'Beach Resort',
        primaryEventId: 'event-123',
      })
    })

    it('should return undefined date/location when no events exist', async () => {
      mockGetByUserIdFn.mockResolvedValue(mockWedding)
      mockGetWeddingEvents.mockResolvedValue([])

      const caller = makeAuthCaller()
      const result = await caller.getDetails()

      expect(result).toEqual({
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
        weddingDate: undefined,
        weddingLocation: undefined,
        primaryEventId: undefined,
      })
    })
  })

  describe('updateDetails', () => {
    const validInput = {
      groomFirstName: 'John',
      groomLastName: 'Doe',
      brideFirstName: 'Jane',
      brideLastName: 'Smith',
      weddingDate: '2025-06-15T00:00:00.000Z',
      weddingLocation: 'Beach Resort',
    }

    it('should throw when no wedding exists', async () => {
      mockGetByUserIdFn.mockResolvedValue(null)

      const caller = makeAuthCaller()
      await expect(caller.updateDetails(validInput)).rejects.toThrow('Wedding not found')
    })

    it('should update wedding names and existing event', async () => {
      mockGetByUserIdFn.mockResolvedValue(mockWedding)
      mockUpdateWeddingFn.mockResolvedValue(mockWedding)
      mockGetWeddingEvents.mockResolvedValue([
        {
          id: 'event-123',
          name: 'Ceremony',
          date: new Date('2025-01-01'),
          venue: 'Old Venue',
          allowTagAlongs: false,
        },
      ])
      mockUpdateEvent.mockResolvedValue({})

      const caller = makeAuthCaller()
      const result = await caller.updateDetails(validInput)

      expect(result).toEqual({ success: true })
      expect(mockUpdateWeddingFn).toHaveBeenCalledWith(mockWedding.id, {
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
      })
      expect(mockUpdateEvent).toHaveBeenCalledWith('wedding-123', {
        eventId: 'event-123',
        eventName: 'Ceremony',
        date: '2025-06-15T00:00:00.000Z',
        venue: 'Beach Resort',
        allowTagAlongs: false,
      })
    })

    it('should create Ceremony event when none exists and date/location provided', async () => {
      mockGetByUserIdFn.mockResolvedValue(mockWedding)
      mockUpdateWeddingFn.mockResolvedValue(mockWedding)
      mockGetWeddingEvents.mockResolvedValue([]) // No events
      mockCreateEvent.mockResolvedValue({ id: 'new-event' })

      const caller = makeAuthCaller()
      await caller.updateDetails(validInput)

      expect(mockCreateEvent).toHaveBeenCalledWith('wedding-123', {
        eventName: 'Ceremony',
        date: '2025-06-15T00:00:00.000Z',
        venue: 'Beach Resort',
        allowTagAlongs: false,
      })
    })

    it('should not create event when no events exist and no date/location provided', async () => {
      mockGetByUserIdFn.mockResolvedValue(mockWedding)
      mockUpdateWeddingFn.mockResolvedValue(mockWedding)
      mockGetWeddingEvents.mockResolvedValue([])

      const caller = makeAuthCaller()
      await caller.updateDetails({
        groomFirstName: 'John',
        groomLastName: 'Doe',
        brideFirstName: 'Jane',
        brideLastName: 'Smith',
      })

      expect(mockCreateEvent).not.toHaveBeenCalled()
      expect(mockUpdateEvent).not.toHaveBeenCalled()
    })

    it('should reject invalid input (empty names)', async () => {
      const caller = makeAuthCaller()

      await expect(
        caller.updateDetails({
          groomFirstName: '',
          groomLastName: 'Doe',
          brideFirstName: 'Jane',
          brideLastName: 'Smith',
        })
      ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    })
  })
})
