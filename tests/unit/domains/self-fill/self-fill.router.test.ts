/**
 * Tests for Self-Fill Domain Router
 *
 * Covers all procedures: getByToken, registerGuest (public) and
 * generateToken, revokeToken, getToken (protected).
 *
 * Uses createSelfFillRouter factory (P3) and mocks both domain services
 * (selfFillService, weddingService) and the injected registration service.
 */

// Mock heavy ESM/generated dependencies loaded transitively by trpc.ts
jest.mock('~/lib/auth', () => ({ auth: { api: { getSession: jest.fn().mockResolvedValue(null) } } }))
jest.mock('~/server/db', () => ({ db: {} }))

jest.mock('~/server/domains/self-fill')
jest.mock('~/server/domains/wedding')

// @ts-expect-error - Importing mock functions from mocked module
import {
  mockFindByToken,
  mockGenerateToken,
  mockGetToken,
  mockRevokeToken,
  mockSelfFillWeddingData,
  resetMocks as resetSelfFillMocks,
} from '~/server/domains/self-fill'

// @ts-expect-error - Importing mock functions from mocked module
import {
  mockGetByUserId,
  mockWedding,
  resetMocks as resetWeddingMocks,
} from '~/server/domains/wedding'

import type { ISelfFillRegistration, SelfFillRegistrationResult } from '~/server/domains/self-fill/self-fill.types'
import { createSelfFillRouter } from '~/server/domains/self-fill/self-fill.router'

// ── Typed mock aliases ───────────────────────────────────────────────────────
const mockFindByTokenFn = mockFindByToken as jest.Mock
const mockGenerateTokenFn = mockGenerateToken as jest.Mock
const mockGetTokenFn = mockGetToken as jest.Mock
const mockRevokeTokenFn = mockRevokeToken as jest.Mock
const mockGetByUserIdFn = mockGetByUserId as jest.Mock

// ── Mock registration service ────────────────────────────────────────────────
const mockRegisterGuest = jest.fn()
const mockRegistrationService: ISelfFillRegistration = {
  registerGuest: mockRegisterGuest,
}

const validToken = 'a'.repeat(32)

const validRegistrationResult: SelfFillRegistrationResult = {
  success: true,
  guestId: 1,
  householdId: 'household-123',
  message: 'Thank you, Alice! You have been added to the guest list.',
}

// ── tRPC caller helpers ──────────────────────────────────────────────────────
function makeRouter() {
  return createSelfFillRouter(mockRegistrationService)
}

function makePublicCaller() {
  return makeRouter().createCaller({
    db: {} as never,
    auth: { userId: null, session: null },
    headers: new Headers(),
  })
}

function makeAuthCaller(userId = 'user-123') {
  return makeRouter().createCaller({
    db: {} as never,
    auth: { userId, session: { user: { id: userId } } as never },
    headers: new Headers(),
  })
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('selfFillRouter', () => {
  beforeEach(() => {
    resetSelfFillMocks()
    resetWeddingMocks()
    mockRegisterGuest.mockReset()
  })

  // ─── getByToken (public query) ─────────────────────────────────────────────

  describe('getByToken', () => {
    it('should return wedding data for a valid token', async () => {
      mockFindByTokenFn.mockResolvedValue(mockSelfFillWeddingData)

      const caller = makePublicCaller()
      const result = await caller.getByToken({ token: validToken })

      expect(result).toEqual(mockSelfFillWeddingData)
      expect(mockFindByTokenFn).toHaveBeenCalledWith(validToken)
    })

    it('should return null for an invalid or expired token', async () => {
      mockFindByTokenFn.mockResolvedValue(null)

      const caller = makePublicCaller()
      const result = await caller.getByToken({ token: validToken })

      expect(result).toBeNull()
    })

    it('should reject an invalid token format', async () => {
      const caller = makePublicCaller()

      await expect(caller.getByToken({ token: 'invalid' })).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      })
    })
  })

  // ─── registerGuest (public mutation) ──────────────────────────────────────

  describe('registerGuest', () => {
    const validInput = {
      token: validToken,
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      phone: '+12025550123',
    }

    it('should delegate to the registration service and return result', async () => {
      mockRegisterGuest.mockResolvedValue(validRegistrationResult)

      const caller = makePublicCaller()
      const result = await caller.registerGuest(validInput)

      expect(result).toEqual(validRegistrationResult)
      expect(mockRegisterGuest).toHaveBeenCalledWith(
        validToken,
        expect.objectContaining({ firstName: 'Alice', lastName: 'Smith' })
      )
    })

    it('should propagate NOT_FOUND from registration service', async () => {
      const { TRPCError } = await import('@trpc/server')
      mockRegisterGuest.mockRejectedValue(
        new TRPCError({ code: 'NOT_FOUND', message: 'Invalid or expired registration link' })
      )

      const caller = makePublicCaller()

      await expect(caller.registerGuest(validInput)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('should propagate CONFLICT from registration service', async () => {
      const { TRPCError } = await import('@trpc/server')
      mockRegisterGuest.mockRejectedValue(
        new TRPCError({ code: 'CONFLICT', message: 'You are already registered for this wedding.' })
      )

      const caller = makePublicCaller()

      await expect(caller.registerGuest(validInput)).rejects.toMatchObject({
        code: 'CONFLICT',
      })
    })

    it('should reject when token is missing from input', async () => {
      const caller = makePublicCaller()
      const { token: _, ...inputWithoutToken } = validInput

      await expect(caller.registerGuest(inputWithoutToken as never)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      })
    })
  })

  // ─── generateToken (protected mutation) ───────────────────────────────────

  describe('generateToken', () => {
    it('should generate a token for the user wedding', async () => {
      mockGetByUserIdFn.mockResolvedValue(mockWedding)
      mockGenerateTokenFn.mockResolvedValue('a'.repeat(32))

      const caller = makeAuthCaller()
      const result = await caller.generateToken({})

      expect(result).toEqual({ token: 'a'.repeat(32) })
      expect(mockGetByUserIdFn).toHaveBeenCalledWith('user-123')
      expect(mockGenerateTokenFn).toHaveBeenCalledWith(mockWedding.id)
    })

    it('should throw NOT_FOUND if user has no wedding', async () => {
      mockGetByUserIdFn.mockResolvedValue(null)

      const caller = makeAuthCaller()

      await expect(caller.generateToken({})).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Wedding not found',
      })
    })

    it('should throw UNAUTHORIZED for unauthenticated requests', async () => {
      const caller = makePublicCaller()

      await expect(caller.generateToken({})).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
    })
  })

  // ─── revokeToken (protected mutation) ─────────────────────────────────────

  describe('revokeToken', () => {
    it('should revoke the token and return success', async () => {
      mockGetByUserIdFn.mockResolvedValue(mockWedding)
      mockRevokeTokenFn.mockResolvedValue(undefined)

      const caller = makeAuthCaller()
      const result = await caller.revokeToken({})

      expect(result).toEqual({ success: true })
      expect(mockRevokeTokenFn).toHaveBeenCalledWith(mockWedding.id)
    })

    it('should throw NOT_FOUND if user has no wedding', async () => {
      mockGetByUserIdFn.mockResolvedValue(null)

      const caller = makeAuthCaller()

      await expect(caller.revokeToken({})).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('should throw UNAUTHORIZED for unauthenticated requests', async () => {
      const caller = makePublicCaller()

      await expect(caller.revokeToken({})).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
    })
  })

  // ─── getToken (protected query) ────────────────────────────────────────────

  describe('getToken', () => {
    it('should return the current token', async () => {
      mockGetByUserIdFn.mockResolvedValue(mockWedding)
      mockGetTokenFn.mockResolvedValue(validToken)

      const caller = makeAuthCaller()
      const result = await caller.getToken()

      expect(result).toEqual({ token: validToken })
      expect(mockGetTokenFn).toHaveBeenCalledWith(mockWedding.id)
    })

    it('should return null token when none is set', async () => {
      mockGetByUserIdFn.mockResolvedValue(mockWedding)
      mockGetTokenFn.mockResolvedValue(null)

      const caller = makeAuthCaller()
      const result = await caller.getToken()

      expect(result).toEqual({ token: null })
    })

    it('should throw NOT_FOUND if user has no wedding', async () => {
      mockGetByUserIdFn.mockResolvedValue(null)

      const caller = makeAuthCaller()

      await expect(caller.getToken()).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })

    it('should throw UNAUTHORIZED for unauthenticated requests', async () => {
      const caller = makePublicCaller()

      await expect(caller.getToken()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      })
    })
  })
})
