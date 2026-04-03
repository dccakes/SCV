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
jest.mock('~/lib/auth', () => ({
  auth: { api: { getSession: jest.fn().mockResolvedValue(null) } },
}))
jest.mock('~/server/db', () => ({ db: {} }))
jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(() => ({ organizationId: 'org-123', role: 'owner' })),
}))

jest.mock('~/server/domains/self-fill')
jest.mock('~/server/domains/wedding')

import { requirePermission } from '~/server/authz/permission-checker'
// @ts-expect-error - Importing mock functions from mocked module
import {
  mockFindByToken,
  mockGenerateToken,
  mockGetTokenWithContext,
  mockRevokeToken,
  mockSelfFillWeddingData,
  resetMocks as resetSelfFillMocks,
} from '~/server/domains/self-fill'
import { createSelfFillRouter } from '~/server/domains/self-fill/self-fill.router'
import type {
  ISelfFillRegistration,
  SelfFillRegistrationResult,
} from '~/server/domains/self-fill/self-fill.types'
// @ts-expect-error - Importing mock functions from mocked module
import { mockGetById, mockWedding, resetMocks as resetWeddingMocks } from '~/server/domains/wedding'

// ── Typed mock aliases ───────────────────────────────────────────────────────
const mockFindByTokenFn = mockFindByToken as jest.Mock
const mockGenerateTokenFn = mockGenerateToken as jest.Mock
const mockGetTokenWithContextFn = mockGetTokenWithContext as jest.Mock
const mockRevokeTokenFn = mockRevokeToken as jest.Mock
const mockGetByIdFn = mockGetById as jest.Mock
const mockRequirePermission = requirePermission as jest.Mock

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

function makeAuthCaller(userId = 'user-123', activeWeddingId: string | null = 'wedding-123') {
  return makeRouter().createCaller({
    db: {} as never,
    auth: {
      userId,
      session: { user: { id: userId } } as never,
      activeWeddingId,
      activeOrganization: { organizationId: 'org-123', role: 'owner' },
    },
    headers: new Headers(),
  })
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('selfFillRouter', () => {
  beforeEach(() => {
    resetSelfFillMocks()
    resetWeddingMocks()
    mockRegisterGuest.mockReset()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-123', role: 'owner' })
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
      mockGetByIdFn.mockResolvedValue(mockWedding)
      mockGenerateTokenFn.mockResolvedValue('a'.repeat(32))

      const caller = makeAuthCaller()
      const result = await caller.generateToken({})

      expect(result).toEqual({ token: 'a'.repeat(32) })
      expect(mockRequirePermission).toHaveBeenCalledWith(
        { userId: 'user-123', activeOrganization: { organizationId: 'org-123', role: 'owner' } },
        { guest_invitation: ['send'] }
      )
      expect(mockGetByIdFn).toHaveBeenCalledWith('wedding-123')
      expect(mockGenerateTokenFn).toHaveBeenCalledWith(mockWedding.id)
    })

    it('should throw NOT_FOUND if user has no wedding', async () => {
      mockGetByIdFn.mockResolvedValue(null)

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
    it('should throw PRECONDITION_FAILED when active wedding is missing', async () => {
      const caller = makeAuthCaller('user-123', null)

      await expect(caller.generateToken({})).rejects.toMatchObject({
        code: 'PRECONDITION_FAILED',
      })
    })

    it('should throw FORBIDDEN when missing permission', async () => {
      const { TRPCError } = await import('@trpc/server')
      mockRequirePermission.mockImplementation(() => {
        throw new TRPCError({ code: 'FORBIDDEN' })
      })
      const caller = makeAuthCaller()

      await expect(caller.generateToken({})).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })
  })

  // ─── revokeToken (protected mutation) ─────────────────────────────────────

  describe('revokeToken', () => {
    it('should revoke the token and return success', async () => {
      mockGetByIdFn.mockResolvedValue(mockWedding)
      mockRevokeTokenFn.mockResolvedValue(undefined)

      const caller = makeAuthCaller()
      const result = await caller.revokeToken({})

      expect(result).toEqual({ success: true })
      expect(mockRevokeTokenFn).toHaveBeenCalledWith(mockWedding.id)
    })

    it('should throw NOT_FOUND if user has no wedding', async () => {
      mockGetByIdFn.mockResolvedValue(null)

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
    const weddingDate = new Date('2026-09-20')
    const expiresAt = new Date('2026-06-01')

    it('should return token, expiresAt, and earliestEventDate', async () => {
      mockGetByIdFn.mockResolvedValue(mockWedding)
      mockGetTokenWithContextFn.mockResolvedValue({
        token: validToken,
        expiresAt,
        earliestEventDate: weddingDate,
      })

      const caller = makeAuthCaller()
      const result = await caller.getToken()

      expect(result).toEqual({ token: validToken, expiresAt, earliestEventDate: weddingDate })
      expect(mockGetTokenWithContextFn).toHaveBeenCalledWith(mockWedding.id)
    })

    it('should return null token, null expiresAt, and null earliestEventDate when no token is set', async () => {
      mockGetByIdFn.mockResolvedValue(mockWedding)
      mockGetTokenWithContextFn.mockResolvedValue({
        token: null,
        expiresAt: null,
        earliestEventDate: null,
      })

      const caller = makeAuthCaller()
      const result = await caller.getToken()

      expect(result).toEqual({ token: null, expiresAt: null, earliestEventDate: null })
    })

    it('should return null expiresAt for legacy tokens with no timestamp', async () => {
      mockGetByIdFn.mockResolvedValue(mockWedding)
      mockGetTokenWithContextFn.mockResolvedValue({
        token: validToken,
        expiresAt: null,
        earliestEventDate: weddingDate,
      })

      const caller = makeAuthCaller()
      const result = await caller.getToken()

      expect(result.token).toBe(validToken)
      expect(result.expiresAt).toBeNull()
    })

    it('should return null earliestEventDate when wedding has no dated events', async () => {
      mockGetByIdFn.mockResolvedValue(mockWedding)
      mockGetTokenWithContextFn.mockResolvedValue({
        token: validToken,
        expiresAt,
        earliestEventDate: null,
      })

      const caller = makeAuthCaller()
      const result = await caller.getToken()

      expect(result.earliestEventDate).toBeNull()
    })

    it('should throw NOT_FOUND if user has no wedding', async () => {
      mockGetByIdFn.mockResolvedValue(null)

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
