/**
 * Tests for Self-Fill Domain Service (token management only)
 *
 * TDD: After the Priority 3 refactor, SelfFillService handles ONLY:
 *   - getWeddingByToken
 *   - generateToken (+ sets selfFillTokenGeneratedAt)
 *   - revokeToken
 *   - getToken
 *   - getTokenWithContext
 *
 * registerGuest has been moved to SelfFillRegistrationService (application layer).
 */

jest.mock('~/server/domains/self-fill/self-fill.repository')

// @ts-expect-error - Importing mock functions from mocked module
import {
  mockFindByToken,
  mockGetEarliestEventDate,
  mockGetToken,
  mockGetWeddingIdByToken,
  mockSelfFillWeddingData,
  mockUpdateToken,
  resetMocks,
  SelfFillRepository,
} from '~/server/domains/self-fill/self-fill.repository'
import { TOKEN_EXPIRY_DAYS } from '~/server/domains/self-fill/self-fill.repository'
import { SelfFillService } from '~/server/domains/self-fill/self-fill.service'

const mockFindByTokenFn = mockFindByToken as jest.Mock
const mockGetWeddingIdByTokenFn = mockGetWeddingIdByToken as jest.Mock
const mockGetTokenFn = mockGetToken as jest.Mock
const mockGetEarliestEventDateFn = mockGetEarliestEventDate as jest.Mock
const mockUpdateTokenFn = mockUpdateToken as jest.Mock

describe('SelfFillService', () => {
  let service: SelfFillService

  beforeEach(() => {
    resetMocks()
    const repo = new SelfFillRepository({})
    service = new SelfFillService(repo)
  })

  // ─── getWeddingByToken ──────────────────────────────────────────────────────

  describe('getWeddingByToken', () => {
    it('should return wedding data when valid token exists', async () => {
      mockFindByTokenFn.mockResolvedValue(mockSelfFillWeddingData)

      const result = await service.getWeddingByToken('a'.repeat(32))

      expect(result).toEqual(mockSelfFillWeddingData)
      expect(mockFindByTokenFn).toHaveBeenCalledWith('a'.repeat(32))
    })

    it('should return null when token does not exist', async () => {
      mockFindByTokenFn.mockResolvedValue(null)

      const result = await service.getWeddingByToken('b'.repeat(32))

      expect(result).toBeNull()
    })
  })

  // ─── generateToken ──────────────────────────────────────────────────────────

  describe('generateToken', () => {
    it('should generate and return a 32-character hex token', async () => {
      mockUpdateTokenFn.mockResolvedValue(undefined)

      const token = await service.generateToken('wedding-123')

      expect(token).toMatch(/^[a-f0-9]{32}$/)
    })

    it('should call updateToken with the generated token and timestamp', async () => {
      mockUpdateTokenFn.mockResolvedValue(undefined)

      const token = await service.generateToken('wedding-123')

      expect(mockUpdateTokenFn).toHaveBeenCalledWith('wedding-123', token, expect.any(Date))
    })

    it('should log token generation for audit purposes', async () => {
      mockUpdateTokenFn.mockResolvedValue(undefined)
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await service.generateToken('wedding-123')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('wedding-123'),
        expect.anything()
      )
      consoleSpy.mockRestore()
    })
  })

  // ─── revokeToken ────────────────────────────────────────────────────────────

  describe('revokeToken', () => {
    it('should call updateToken with null to revoke', async () => {
      mockUpdateTokenFn.mockResolvedValue(undefined)

      await service.revokeToken('wedding-123')

      expect(mockUpdateTokenFn).toHaveBeenCalledWith('wedding-123', null, null)
    })

    it('should log token revocation for audit purposes', async () => {
      mockUpdateTokenFn.mockResolvedValue(undefined)
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await service.revokeToken('wedding-123')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('wedding-123'),
        expect.anything()
      )
      consoleSpy.mockRestore()
    })
  })

  // ─── getToken ───────────────────────────────────────────────────────────────

  describe('getToken', () => {
    it('should return null when no token is set', async () => {
      mockGetTokenFn.mockResolvedValue(null)

      const result = await service.getToken('wedding-123')

      expect(result).toBeNull()
    })

    it('should return token with null expiresAt for a legacy token (no generatedAt)', async () => {
      mockGetTokenFn.mockResolvedValue({ token: 'abc123token00000000000000000000', generatedAt: null })

      const result = await service.getToken('wedding-123')

      expect(result).toEqual({ token: 'abc123token00000000000000000000', expiresAt: null })
    })

    it('should compute expiresAt as generatedAt + TOKEN_EXPIRY_DAYS', async () => {
      const generatedAt = new Date('2026-01-01T12:00:00Z')
      mockGetTokenFn.mockResolvedValue({ token: 'abc123token00000000000000000000', generatedAt })

      const result = await service.getToken('wedding-123')

      const expectedExpiry = new Date('2026-01-01T12:00:00Z')
      expectedExpiry.setDate(expectedExpiry.getDate() + TOKEN_EXPIRY_DAYS)
      expect(result?.expiresAt).toEqual(expectedExpiry)
      expect(result?.token).toBe('abc123token00000000000000000000')
    })

    it('should not mutate the generatedAt date when computing expiresAt', async () => {
      const generatedAt = new Date('2026-01-01T12:00:00Z')
      const originalTime = generatedAt.getTime()
      mockGetTokenFn.mockResolvedValue({ token: 'abc123token00000000000000000000', generatedAt })

      await service.getToken('wedding-123')

      expect(generatedAt.getTime()).toBe(originalTime)
    })

    // ── Expiry boundary: TOKEN_EXPIRY_DAYS = 90 ─────────────────────────────

    it('should compute a valid expiresAt for a token generated exactly 89 days ago (not expired)', async () => {
      const generatedAt = new Date()
      generatedAt.setDate(generatedAt.getDate() - 89)
      mockGetTokenFn.mockResolvedValue({ token: 'abc123token00000000000000000000', generatedAt })

      const result = await service.getToken('wedding-123')

      // expiresAt should be in the future (89 days ago + 90 days = 1 day from now)
      expect(result?.expiresAt).not.toBeNull()
      expect(result!.expiresAt!.getTime()).toBeGreaterThan(Date.now())
    })

    it('should compute an expiresAt in the past for a token generated 91 days ago (expired)', async () => {
      const generatedAt = new Date()
      generatedAt.setDate(generatedAt.getDate() - 91)
      mockGetTokenFn.mockResolvedValue({ token: 'abc123token00000000000000000000', generatedAt })

      const result = await service.getToken('wedding-123')

      // expiresAt should be in the past (91 days ago + 90 days = 1 day ago)
      expect(result?.expiresAt).not.toBeNull()
      expect(result!.expiresAt!.getTime()).toBeLessThan(Date.now())
    })

    it('should compute expiresAt as approximately today for a token generated exactly 90 days ago', async () => {
      const generatedAt = new Date()
      generatedAt.setDate(generatedAt.getDate() - TOKEN_EXPIRY_DAYS)
      mockGetTokenFn.mockResolvedValue({ token: 'abc123token00000000000000000000', generatedAt })

      const result = await service.getToken('wedding-123')

      // expiresAt = generatedAt + 90 days ≈ today (within a minute of test execution)
      expect(result?.expiresAt).not.toBeNull()
      const diffMs = Math.abs(result!.expiresAt!.getTime() - Date.now())
      expect(diffMs).toBeLessThan(60_000) // within 1 minute
    })
  })

  // ─── getTokenWithContext ─────────────────────────────────────────────────────

  describe('getTokenWithContext', () => {
    it('should return nulls when no token is set', async () => {
      mockGetTokenFn.mockResolvedValue(null)
      mockGetEarliestEventDateFn.mockResolvedValue(null)

      const result = await service.getTokenWithContext('wedding-123')

      expect(result).toEqual({ token: null, expiresAt: null, earliestEventDate: null })
    })

    it('should return token, expiresAt, and earliestEventDate together', async () => {
      const generatedAt = new Date('2026-01-01T00:00:00Z')
      const weddingDate = new Date('2026-06-15')
      mockGetTokenFn.mockResolvedValue({ token: 'abc123token00000000000000000000', generatedAt })
      mockGetEarliestEventDateFn.mockResolvedValue(weddingDate)

      const result = await service.getTokenWithContext('wedding-123')

      const expectedExpiry = new Date('2026-01-01T00:00:00Z')
      expectedExpiry.setDate(expectedExpiry.getDate() + TOKEN_EXPIRY_DAYS)
      expect(result.token).toBe('abc123token00000000000000000000')
      expect(result.expiresAt).toEqual(expectedExpiry)
      expect(result.earliestEventDate).toEqual(weddingDate)
    })

    it('should return null expiresAt for a legacy token with no generatedAt', async () => {
      mockGetTokenFn.mockResolvedValue({ token: 'abc123token00000000000000000000', generatedAt: null })
      mockGetEarliestEventDateFn.mockResolvedValue(new Date('2026-06-15'))

      const result = await service.getTokenWithContext('wedding-123')

      expect(result.token).toBe('abc123token00000000000000000000')
      expect(result.expiresAt).toBeNull()
    })

    it('should return null earliestEventDate when wedding has no dated events', async () => {
      const generatedAt = new Date('2026-01-01T00:00:00Z')
      mockGetTokenFn.mockResolvedValue({ token: 'abc123token00000000000000000000', generatedAt })
      mockGetEarliestEventDateFn.mockResolvedValue(null)

      const result = await service.getTokenWithContext('wedding-123')

      expect(result.earliestEventDate).toBeNull()
    })

    it('should fetch token and event date in parallel', async () => {
      mockGetTokenFn.mockResolvedValue(null)
      mockGetEarliestEventDateFn.mockResolvedValue(null)

      await service.getTokenWithContext('wedding-123')

      // Both calls should have been made with the same weddingId
      expect(mockGetTokenFn).toHaveBeenCalledWith('wedding-123')
      expect(mockGetEarliestEventDateFn).toHaveBeenCalledWith('wedding-123')
    })
  })
})
