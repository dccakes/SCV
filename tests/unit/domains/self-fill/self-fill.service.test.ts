/**
 * Tests for Self-Fill Domain Service (token management only)
 *
 * TDD: After the Priority 3 refactor, SelfFillService handles ONLY:
 *   - getWeddingByToken
 *   - generateToken (+ sets selfFillTokenGeneratedAt)
 *   - revokeToken
 *   - getToken
 *
 * registerGuest has been moved to SelfFillRegistrationService (application layer).
 */

jest.mock('~/server/domains/self-fill/self-fill.repository')

// @ts-expect-error - Importing mock functions from mocked module
import {
  mockFindByToken,
  mockGetToken,
  mockGetWeddingIdByToken,
  mockSelfFillWeddingData,
  mockUpdateToken,
  resetMocks,
  SelfFillRepository,
} from '~/server/domains/self-fill/self-fill.repository'
import { SelfFillService } from '~/server/domains/self-fill/self-fill.service'

const mockFindByTokenFn = mockFindByToken as jest.Mock
const mockGetWeddingIdByTokenFn = mockGetWeddingIdByToken as jest.Mock
const mockGetTokenFn = mockGetToken as jest.Mock
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
    it('should return token when it exists', async () => {
      mockGetTokenFn.mockResolvedValue('abc123token00000000000000000000000')

      const result = await service.getToken('wedding-123')

      expect(result).toBe('abc123token00000000000000000000000')
      expect(mockGetTokenFn).toHaveBeenCalledWith('wedding-123')
    })

    it('should return null when no token is set', async () => {
      mockGetTokenFn.mockResolvedValue(null)

      const result = await service.getToken('wedding-123')

      expect(result).toBeNull()
    })
  })
})
