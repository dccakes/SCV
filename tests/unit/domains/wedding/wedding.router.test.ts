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
import {
  mockGetById,
  mockUpdateWedding,
  mockWedding,
  resetMocks as resetWeddingMocks,
} from '~/server/domains/wedding'
import { weddingRouter } from '~/server/domains/wedding/wedding.router'

const mockGetByIdFn = mockGetById as jest.Mock
const mockUpdateWeddingFn = mockUpdateWedding as jest.Mock
const mockGetWeddingEvents = eventService.getWeddingEvents as jest.Mock
const mockCreateEvent = eventService.createEvent as jest.Mock
const mockUpdateEvent = eventService.updateEvent as jest.Mock

// ── tRPC caller helpers ──────────────────────────────────────────────────────
function makeAuthCaller(userId = 'user-123', activeWeddingId: string | null = 'wedding-123') {
  return weddingRouter.createCaller({
    db: {} as never,
    auth: { userId, session: { user: { id: userId } } as never, activeWeddingId },
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
    it('should throw when active wedding is missing', async () => {
      const caller = makeAuthCaller('user-123', null)
      await expect(caller.getDetails()).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' })
    })

    it('should throw when wedding lookup fails', async () => {
      mockGetByIdFn.mockRejectedValue(new Error('Wedding not found'))

      const caller = makeAuthCaller()
      await expect(caller.getDetails()).rejects.toThrow('Wedding not found')
    })

    it('should return wedding details with event date and location', async () => {
      mockGetByIdFn.mockResolvedValue(mockWedding)
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

      expect(mockGetByIdFn).toHaveBeenCalledWith('wedding-123')

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
      mockGetByIdFn.mockResolvedValue(mockWedding)
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
    }

    it('should throw when active wedding is missing', async () => {
      const caller = makeAuthCaller('user-123', null)
      await expect(caller.updateDetails(validInput)).rejects.toMatchObject({
        code: 'PRECONDITION_FAILED',
      })
    })

    it('should propagate service errors', async () => {
      mockUpdateWeddingFn.mockRejectedValue(new Error('Wedding not found'))
      const caller = makeAuthCaller()
      await expect(caller.updateDetails(validInput)).rejects.toThrow('Wedding not found')
    })

    it('should update wedding names only', async () => {
      mockUpdateWeddingFn.mockResolvedValue(mockWedding)

      const caller = makeAuthCaller()
      const result = await caller.updateDetails(validInput)

      expect(result).toEqual({ success: true })
      expect(mockUpdateWeddingFn).toHaveBeenCalledWith({
        ctx: expect.objectContaining({ userId: 'user-123' }),
        weddingId: mockWedding.id,
        data: {
          groomFirstName: 'John',
          groomLastName: 'Doe',
          brideFirstName: 'Jane',
          brideLastName: 'Smith',
        },
      })
      expect(mockGetWeddingEvents).not.toHaveBeenCalled()
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
