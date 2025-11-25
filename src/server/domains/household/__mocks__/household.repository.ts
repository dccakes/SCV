/**
 * Household Domain - Repository Mock
 *
 * Jest mock for the HouseholdRepository class.
 * Used for unit testing the HouseholdService.
 */

import {
  type Household,
  type HouseholdSearchResult,
  type HouseholdWithGuestsAndGifts,
} from '~/server/domains/household/household.types'

export const mockHouseholdRepository = {
  findById: jest.fn<Promise<Household | null>, [string]>(),
  findByIdWithGuestsAndGifts: jest.fn<Promise<HouseholdWithGuestsAndGifts | null>, [string]>(),
  findByUserId: jest.fn<Promise<Household[]>, [string]>(),
  findByUserIdWithGuestsAndGifts: jest.fn<Promise<HouseholdWithGuestsAndGifts[]>, [string]>(),
  create: jest.fn<Promise<Household>, [object]>(),
  createWithGifts: jest.fn<Promise<HouseholdWithGuestsAndGifts>, [object, string[]]>(),
  update: jest.fn<Promise<Household>, [string, object]>(),
  delete: jest.fn<Promise<Household>, [string]>(),
  search: jest.fn<Promise<HouseholdSearchResult[]>, [string]>(),
  exists: jest.fn<Promise<boolean>, [string]>(),
  belongsToUser: jest.fn<Promise<boolean>, [string, string]>(),
}

export const HouseholdRepository = jest.fn().mockImplementation(() => mockHouseholdRepository)
