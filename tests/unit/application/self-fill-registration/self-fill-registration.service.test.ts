/**
 * Tests for Self-Fill Registration Application Service
 *
 * TDD: Tests define expected behavior for cross-domain guest registration.
 * This service orchestrates: token validation → household creation → guest creation.
 *
 * Covers: P1 (DB constraint), P2 (dedup inside tx), P5 (expiry via repo),
 *         P6 (email normalization), P8 (unified error messages), P10 (empty events),
 *         P11 (single token query), P12 (constants)
 */

jest.mock('~/server/domains/self-fill/self-fill.repository')
jest.mock('~/server/domains/household/household.repository')
jest.mock('~/server/domains/guest/guest.repository')

import { SelfFillRegistrationService } from '~/server/application/self-fill-registration/self-fill-registration.service'
// @ts-expect-error - Importing mock functions from mocked module
import {
  GuestRepository,
  mockCreate,
  mockFindByEmailAndWeddingId,
  mockGuest,
  resetMocks as resetGuestMocks,
} from '~/server/domains/guest/guest.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  HouseholdRepository,
  mockCreateWithGifts,
  mockHousehold,
  resetMocks as resetHouseholdMocks,
} from '~/server/domains/household/household.repository'
// @ts-expect-error - Importing mock functions from mocked module
import {
  mockFindByToken,
  mockSelfFillWeddingData,
  resetMocks as resetSelfFillMocks,
  SelfFillRepository,
} from '~/server/domains/self-fill/self-fill.repository'

// ── Typed aliases ─────────────────────────────────────────────────────────────
const mockFindByTokenFn = mockFindByToken as jest.Mock
const mockCreateWithGiftsFn = mockCreateWithGifts as jest.Mock
const mockCreateFn = mockCreate as jest.Mock
const mockFindByEmailAndWeddingIdFn = mockFindByEmailAndWeddingId as jest.Mock

// ── Mock db with $transaction ─────────────────────────────────────────────────
const createMockDb = () => ({
  $transaction: jest
    .fn()
    .mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn({})),
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
      mockFindByTokenFn.mockResolvedValue(mockSelfFillWeddingData)
      mockFindByEmailAndWeddingIdFn.mockResolvedValue(null)
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

    it('should use a single findByToken call — no separate getWeddingIdByToken (P11)', async () => {
      await service.registerGuest(validToken, validGuestInput)

      expect(mockFindByTokenFn).toHaveBeenCalledTimes(1)
      expect(mockFindByTokenFn).toHaveBeenCalledWith(validToken)
    })

    it('should create a household for the guest', async () => {
      await service.registerGuest(validToken, validGuestInput)

      expect(mockCreateWithGiftsFn).toHaveBeenCalledWith(
        expect.objectContaining({ weddingId: 'wedding-123' }),
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

  // ─── Token validation — single query (P11) ────────────────────────────────

  describe('registerGuest - invalid or expired token (P11)', () => {
    it('should throw NOT_FOUND when findByToken returns null', async () => {
      mockFindByTokenFn.mockResolvedValue(null)

      await expect(service.registerGuest(validToken, validGuestInput)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: expect.stringContaining('registration link'),
      })
    })

    it('should only call findByToken once — no second query (P11)', async () => {
      mockFindByTokenFn.mockResolvedValue(null)

      await expect(service.registerGuest(validToken, validGuestInput)).rejects.toBeDefined()

      expect(mockFindByTokenFn).toHaveBeenCalledTimes(1)
    })
  })

  // ─── Empty events guard (P10) ─────────────────────────────────────────────

  describe('registerGuest - empty events guard (P10)', () => {
    it('should throw NOT_FOUND when wedding has no events', async () => {
      mockFindByTokenFn.mockResolvedValue({ ...mockSelfFillWeddingData, events: [] })

      await expect(service.registerGuest(validToken, validGuestInput)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: expect.stringContaining('registration link'),
      })
    })

    it('should not create household or guest when events are empty', async () => {
      mockFindByTokenFn.mockResolvedValue({ ...mockSelfFillWeddingData, events: [] })

      await expect(service.registerGuest(validToken, validGuestInput)).rejects.toBeDefined()

      expect(mockCreateWithGiftsFn).not.toHaveBeenCalled()
      expect(mockCreateFn).not.toHaveBeenCalled()
    })
  })

  // ─── Duplicate prevention inside transaction (P2) ────────────────────────

  describe('registerGuest - duplicate prevention inside transaction (P2)', () => {
    it('should throw CONFLICT when guest with same email already registered', async () => {
      mockFindByTokenFn.mockResolvedValue(mockSelfFillWeddingData)
      mockFindByEmailAndWeddingIdFn.mockResolvedValue(mockGuest)

      await expect(service.registerGuest(validToken, validGuestInput)).rejects.toMatchObject({
        code: 'CONFLICT',
        message: 'You are already registered for this wedding.',
      })
    })

    it('should perform duplicate check inside the transaction (P2)', async () => {
      mockFindByTokenFn.mockResolvedValue(mockSelfFillWeddingData)
      mockFindByEmailAndWeddingIdFn.mockResolvedValue(null)
      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      mockCreateFn.mockResolvedValue(mockGuest)

      await service.registerGuest(validToken, validGuestInput)

      expect(mockDb.$transaction).toHaveBeenCalledTimes(1)
      expect(mockFindByEmailAndWeddingIdFn).toHaveBeenCalledWith('alice@example.com', 'wedding-123')
    })

    it('should skip duplicate check when email is null', async () => {
      mockFindByTokenFn.mockResolvedValue(mockSelfFillWeddingData)
      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      mockCreateFn.mockResolvedValue(mockGuest)

      const result = await service.registerGuest(validToken, { ...validGuestInput, email: null })

      expect(result.success).toBe(true)
      expect(mockFindByEmailAndWeddingIdFn).not.toHaveBeenCalled()
    })
  })

  // ─── Email normalization (P6) ─────────────────────────────────────────────

  describe('registerGuest - email normalization (P6)', () => {
    beforeEach(() => {
      mockFindByTokenFn.mockResolvedValue(mockSelfFillWeddingData)
      mockFindByEmailAndWeddingIdFn.mockResolvedValue(null)
      mockCreateWithGiftsFn.mockResolvedValue(mockHousehold)
      mockCreateFn.mockResolvedValue(mockGuest)
    })

    it('should convert empty string email to null', async () => {
      await service.registerGuest(validToken, { ...validGuestInput, email: '' })

      expect(mockCreateFn).toHaveBeenCalledWith(expect.objectContaining({ email: null }))
    })

    it('should lowercase email before duplicate check and storage', async () => {
      await service.registerGuest(validToken, { ...validGuestInput, email: 'ALICE@EXAMPLE.COM' })

      expect(mockFindByEmailAndWeddingIdFn).toHaveBeenCalledWith('alice@example.com', 'wedding-123')
      expect(mockCreateFn).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'alice@example.com' })
      )
    })

    it('should trim whitespace from email', async () => {
      await service.registerGuest(validToken, {
        ...validGuestInput,
        email: '  alice@example.com  ',
      })

      expect(mockFindByEmailAndWeddingIdFn).toHaveBeenCalledWith('alice@example.com', 'wedding-123')
    })
  })

  // ─── Unified error messages (P8) ─────────────────────────────────────────

  describe('registerGuest - unified error messages (P8)', () => {
    it('should use same error message for invalid token as for expired token', async () => {
      mockFindByTokenFn.mockResolvedValue(null)

      await expect(service.registerGuest(validToken, validGuestInput)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Invalid or expired registration link',
      })
    })

    it('CONFLICT message should not reveal which field was duplicate', async () => {
      mockFindByTokenFn.mockResolvedValue(mockSelfFillWeddingData)
      mockFindByEmailAndWeddingIdFn.mockResolvedValue(mockGuest)

      await expect(service.registerGuest(validToken, validGuestInput)).rejects.toMatchObject({
        code: 'CONFLICT',
        message: 'You are already registered for this wedding.',
      })
    })
  })

  // ─── Error handling ────────────────────────────────────────────────────────

  describe('registerGuest - error handling', () => {
    it('should wrap database errors as INTERNAL_SERVER_ERROR', async () => {
      mockFindByTokenFn.mockResolvedValue(mockSelfFillWeddingData)
      mockFindByEmailAndWeddingIdFn.mockResolvedValue(null)
      mockCreateWithGiftsFn.mockRejectedValue(new Error('DB connection failed'))

      await expect(service.registerGuest(validToken, validGuestInput)).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
      })
    })

    it('should log errors for debugging', async () => {
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
