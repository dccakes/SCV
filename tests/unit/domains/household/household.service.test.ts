/**
 * Tests for Household Domain Service
 *
 * Note: The HouseholdService has complex cross-domain orchestration.
 * These tests focus on repository interactions and basic service behavior.
 * Integration tests would be needed for full workflow coverage.
 */

// Must mock before importing the service
jest.mock('~/server/domains/household/household.repository')
jest.mock('~/server/infrastructure/database/client')

// @ts-expect-error - Importing mock functions from mocked module
import {
  HouseholdRepository,
  mockDelete,
  mockFindById,
  mockFindByIdWithGuestsAndGifts,
  mockFindByUserIdWithGuestsAndGifts,
  mockHousehold,
  mockHouseholdWithGuestsAndGifts,
  mockSearch,
  mockSearchResult,
  mockUpdate,
  resetMocks,
} from '~/server/domains/household/household.repository'
import { HouseholdService } from '~/server/domains/household/household.service'
// @ts-expect-error - Importing mock functions from mocked module
import { db, resetMocks as resetDbMocks } from '~/server/infrastructure/database/client'

// Create typed aliases for mocked functions
const mockDeleteFn = mockDelete as jest.Mock
const mockSearchFn = mockSearch as jest.Mock
const mockFindByIdFn = mockFindById as jest.Mock
const mockFindByIdWithGuestsAndGiftsFn = mockFindByIdWithGuestsAndGifts as jest.Mock
const mockFindByUserIdWithGuestsAndGiftsFn = mockFindByUserIdWithGuestsAndGifts as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock

describe('HouseholdService', () => {
  let householdService: HouseholdService

  beforeEach(() => {
    resetMocks()
    resetDbMocks()
    const mockRepository = new HouseholdRepository({})
    householdService = new HouseholdService(mockRepository, db)
  })

  describe('deleteHousehold', () => {
    it('should delete a household', async () => {
      mockDeleteFn.mockResolvedValue(mockHousehold)

      const result = await householdService.deleteHousehold({ householdId: 'household-123' })

      expect(result).toBe('household-123')
      expect(mockDeleteFn).toHaveBeenCalledWith('household-123')
    })
  })

  describe('searchHouseholds', () => {
    it('should search households by guest name', async () => {
      mockSearchFn.mockResolvedValue([mockSearchResult])

      const result = await householdService.searchHouseholds({ searchText: 'John' })

      expect(result).toEqual([mockSearchResult])
      expect(mockSearchFn).toHaveBeenCalledWith('John')
    })

    it('should return empty array when no matches found', async () => {
      mockSearchFn.mockResolvedValue([])

      const result = await householdService.searchHouseholds({ searchText: 'Nonexistent' })

      expect(result).toEqual([])
    })
  })

  describe('getById', () => {
    it('should return a household when found', async () => {
      mockFindByIdFn.mockResolvedValue(mockHousehold)

      const result = await householdService.getById('household-123')

      expect(result).toEqual(mockHousehold)
      expect(mockFindByIdFn).toHaveBeenCalledWith('household-123')
    })

    it('should return null when household not found', async () => {
      mockFindByIdFn.mockResolvedValue(null)

      const result = await householdService.getById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('getByIdWithGuestsAndGifts', () => {
    it('should return household with guests and gifts', async () => {
      mockFindByIdWithGuestsAndGiftsFn.mockResolvedValue(mockHouseholdWithGuestsAndGifts)

      const result = await householdService.getByIdWithGuestsAndGifts('household-123')

      expect(result).toEqual(mockHouseholdWithGuestsAndGifts)
      expect(result?.guests).toHaveLength(2)
      expect(result?.gifts).toHaveLength(1)
    })
  })

  describe('getUserHouseholds', () => {
    it('should return all households for a user with guests and gifts', async () => {
      mockFindByUserIdWithGuestsAndGiftsFn.mockResolvedValue([mockHouseholdWithGuestsAndGifts])

      const result = await householdService.getUserHouseholds('user-123')

      expect(result).toEqual([mockHouseholdWithGuestsAndGifts])
      expect(mockFindByUserIdWithGuestsAndGiftsFn).toHaveBeenCalledWith('user-123')
    })
  })

  // Note: createHousehold and updateHousehold have complex orchestration
  // that requires database mocking for guest, invitation, and gift operations.
  // These would be better tested with integration tests or by mocking the db object more completely.
})
