/**
 * Gift Domain - Repository Mock
 *
 * Jest mock for the GiftRepository class.
 * Used for unit testing the GiftService.
 */

import { type Gift } from '~/server/domains/gift/gift.types'

export const mockGiftRepository = {
  findById: jest.fn<Promise<Gift | null>, [string, string]>(),
  findByHouseholdId: jest.fn<Promise<Gift[]>, [string]>(),
  findByEventId: jest.fn<Promise<Gift[]>, [string]>(),
  create: jest.fn<Promise<Gift>, [{ householdId: string; eventId: string; description?: string; thankyou?: boolean }]>(),
  createMany: jest.fn<Promise<{ count: number }>, [Array<{ householdId: string; eventId: string; description?: string; thankyou?: boolean }>]>(),
  update: jest.fn<Promise<Gift>, [string, string, { description?: string; thankyou?: boolean }]>(),
  upsert: jest.fn<Promise<Gift>, [{ householdId: string; eventId: string; description?: string | null; thankyou: boolean }]>(),
  delete: jest.fn<Promise<Gift>, [string, string]>(),
  exists: jest.fn<Promise<boolean>, [string, string]>(),
}

export const GiftRepository = jest.fn().mockImplementation(() => mockGiftRepository)
