/**
 * Tests for Self-Fill Registration Application Service
 *
 * TDD: Tests define expected behavior for cross-domain guest registration.
 * This service orchestrates: token validation → household creation → guest creation.
 *
 * Covers: Priority 2 (transaction), 3 (arch), 5 (dedup), 12 (logging), 13 (error handling)
 */

jest.mock('~/server/domains/self-fill/self-fill.repository')
jest.mock('~/server/domains/household/household.repository')
jest.mock('~/server/domains/guest/guest.repository')

// @ts-expect-error - Importing mock functions from mocked module
import {
  SelfFillRepository,
  mockFindByToken,
  mockGetWeddingIdByToken,
  mockSelfFillWeddingData,
  resetMocks as resetSelfFillMocks,
} from '~/server/domains/self-fill/self-fill.repository'

// @ts-expect-error - Importing mock functions from mocked module
import {
  HouseholdRepository,
  mockCreateWithGifts,
  mockHousehold,
  resetMocks as resetHouseholdMocks,
} from '~/server/domains/household/household.repository'

// @ts-expect-error - Importing mock functions from mocked module
import {
  GuestRepository,
  mockCreate,
  mockFindByEmailAndWeddingId,
  mockGuest,
  resetMocks as resetGuestMocks,
} from '~/server/domains/guest/guest.repository'

import { SelfFillRegistrationService } from '~/server/application/self-fill-registration/self-fill-registration.service'

// ── Typed aliases ─────────────────────────────────────────────────────────────
const mockFindByTokenFn = mockFindByToken as jest.Mock
const mockGetWeddingIdByTokenFn = mockGetWeddingIdByToken as jest.Mock
const mockCreateWithGiftsFn = mockCreateWithGifts as jest.Mock
const mockCreateFn = mockCreate as jest.Mock
const mockFindByEmailAndWeddingIdFn = mockFindByEmailAndWeddingId as jest.Mock

// ── Mock db with $transaction ─────────────────────────────────────────────────
const createMockDb = () => ({
  $transaction: jest.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
})

const validToken = 'a'.repeat(32)
const validGuestInput = {
  firstName: 'Alice',
  lastName: 'Smith',
  email: 'alice@example.com',
  phone: '+12025550123',
}

describe('SelfFillRegistrationService', () => {
  let service: SelfFillRegistrationService
  let mockDb: ReturnType<typeof createMockDb>

  beforeEach(() => {
    resetSelfFillMocks()
    resetHouseholdMocks()
    resetGuestMocks()

    mockDb = createMockDb()
    const selfFillRepo = new SelfFillRepository({})
    const householdRepo = new HouseholdRepository({})
    const guestRepo = new GuestRepository({})

    service = new SelfFillRegistrationService(
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      mockDb as any,
      selfFillRepo,
      householdRepo,
      guestRepo
    )
  })

  // ─── Happy path ─────────────────────────────────────────────────────────────

  describe('registerGuest - happy path', () => {
    beforeEach(() => {
      mockGetWeddingIdByTokenFn.mockResolvedValue('wedding-123')
      mockFindByTokenFn.mockResolvedValue(mockSelfFillWeddingData)
      mockFindByEmailAndWeddingIdFn.mockResolvedValue(null) // No duplicate
      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      mockCreateFn.mockResolvedValue(mockGuest)
    })

    it('should return a successful registration result', async () => {
      const result = await service.registerGuest(validToken, validGuestInput)

      expect(result.success).toBe(true)
      expect(result.guestId).toBe(mockGuest.id)
      expect(result.householdId).toBe(mockHousehold.id)
      expect(result.message).toContain('Alice')
    })

    it('should create a household for the guest', async () => {
      await service.registerGuest(validToken, validGuestInput)

      expect(mockCreateWithGiftsFn).toHaveBeenCalledWith(
        { weddingId: 'wedding-123' },
        expect.arrayContaining(['event-123', 'event-456'])
      )
    })

    it('should create the guest as primary contact with ADULT age group', async () => {
      await service.registerGuest(validToken, validGuestInput)

      expect(mockCreateFn).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Alice',
          lastName: 'Smith',
          email: 'alice@example.com',
          phone: '+12025550123',
          isPrimaryContact: true,
          ageGroup: 'ADULT',
          weddingId: 'wedding-123',
          householdId: mockHousehold.id,
        })
      )
    })

    it('should create invitations for all events with Invited status', async () => {
      await service.registerGuest(validToken, validGuestInput)

      expect(mockCreateFn).toHaveBeenCalledWith(
        expect.objectContaining({
          invitations: expect.arrayContaining([
            expect.objectContaining({ eventId: 'event-123', rsvp: 'Invited' }),
            expect.objectContaining({ eventId: 'event-456', rsvp: 'Invited' }),
          ]),
        })
      )
    })

    it('should wrap all operations in a database transaction', async () => {
      await service.registerGuest(validToken, validGuestInput)

      expect(mockDb.$transaction).toHaveBeenCalledTimes(1)
    })

    it('should log successful guest registration for audit', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await service.registerGuest(validToken, validGuestInput)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('wedding-123'),
        expect.anything()
      )
      consoleSpy.mockRestore()
    })
  })

  // ─── Invalid token ──────────────────────────────────────────────────────────

  describe('registerGuest - invalid token', () => {
    it('should throw NOT_FOUND when token does not exist', async () => {
      mockGetWeddingIdByTokenFn.mockResolvedValue(null)

      await expect(service.registerGuest(validToken, validGuestInput)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: expect.stringContaining('registration link'),
      })
    })

    it('should throw NOT_FOUND when wedding data cannot be loaded', async () => {
      mockGetWeddingIdByTokenFn.mockResolvedValue('wedding-123')
      mockFindByTokenFn.mockResolvedValue(null)

      await expect(service.registerGuest(validToken, validGuestInput)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: expect.stringContaining('Wedding not found'),
      })
    })
  })

  // ─── Duplicate guest prevention (Priority 5) ─────────────────────────────

  describe('registerGuest - duplicate prevention', () => {
    it('should throw CONFLICT when guest with same email already registered', async () => {
      mockGetWeddingIdByTokenFn.mockResolvedValue('wedding-123')
      mockFindByTokenFn.mockResolvedValue(mockSelfFillWeddingData)
      mockFindByEmailAndWeddingIdFn.mockResolvedValue(mockGuest) // Duplicate found

      await expect(service.registerGuest(validToken, validGuestInput)).rejects.toMatchObject({
        code: 'CONFLICT',
        message: expect.stringContaining('already registered'),
      })
    })

    it('should skip duplicate check when email is null', async () => {
      mockGetWeddingIdByTokenFn.mockResolvedValue('wedding-123')
      mockFindByTokenFn.mockResolvedValue(mockSelfFillWeddingData)
      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      mockCreateFn.mockResolvedValue(mockGuest)

      const inputWithoutEmail = { ...validGuestInput, email: null }
      const result = await service.registerGuest(validToken, inputWithoutEmail)

      expect(result.success).toBe(true)
      expect(mockFindByEmailAndWeddingIdFn).not.toHaveBeenCalled()
    })
  })

  // ─── Email normalization ─────────────────────────────────────────────────

  describe('registerGuest - email normalization', () => {
    it('should convert empty string email to null', async () => {
      mockGetWeddingIdByTokenFn.mockResolvedValue('wedding-123')
      mockFindByTokenFn.mockResolvedValue(mockSelfFillWeddingData)
      mockFindByEmailAndWeddingIdFn.mockResolvedValue(null)
      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      mockCreateFn.mockResolvedValue(mockGuest)

      await service.registerGuest(validToken, { ...validGuestInput, email: '' })

      expect(mockCreateFn).toHaveBeenCalledWith(
        expect.objectContaining({ email: null })
      )
    })
  })

  // ─── Error handling (Priority 13) ─────────────────────────────────────────

  describe('registerGuest - error handling', () => {
    it('should propagate database errors with meaningful context', async () => {
      mockGetWeddingIdByTokenFn.mockResolvedValue('wedding-123')
      mockFindByTokenFn.mockResolvedValue(mockSelfFillWeddingData)
      mockFindByEmailAndWeddingIdFn.mockResolvedValue(null)
      mockCreateWithGiftsFn.mockRejectedValue(new Error('DB connection failed'))

      await expect(service.registerGuest(validToken, validGuestInput)).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      })
    })

    it('should log errors for debugging', async () => {
      mockGetWeddingIdByTokenFn.mockResolvedValue('wedding-123')
      mockFindByTokenFn.mockResolvedValue(mockSelfFillWeddingData)
      mockFindByEmailAndWeddingIdFn.mockResolvedValue(null)
      mockCreateWithGiftsFn.mockRejectedValue(new Error('DB connection failed'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await expect(service.registerGuest(validToken, validGuestInput)).rejects.toBeDefined()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('wedding-123'),
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })
  })
})
