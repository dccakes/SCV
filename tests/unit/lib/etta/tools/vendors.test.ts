/**
 * @jest-environment node
 */

import { vendorService } from '~/server/domains/vendor'
import { db } from '~/server/db'
import { getVendorTools } from '~/lib/etta/tools/vendors'
import type { EttaContext } from '~/lib/etta/types'

jest.mock('~/server/domains/vendor', () => ({
  vendorService: {
    getVendors: jest.fn(),
  },
}))

jest.mock('~/server/db', () => ({
  db: {
    ettaSuggestion: {
      create: jest.fn(),
    },
  },
}))

const mockVendorService = vendorService as {
  getVendors: jest.Mock
}

const mockDb = db as {
  ettaSuggestion: {
    create: jest.Mock
  }
}

const mockCtx: EttaContext = {
  weddingId: 'wedding-123',
  ettaActorId: 'actor-123',
  actor: 'couple',
  wedding: {
    groomFirstName: 'John',
    groomLastName: 'Doe',
    brideFirstName: 'Jane',
    brideLastName: 'Smith',
  },
  guestCount: 50,
  eventCount: 2,
  vendorCount: 3,
  pendingSuggestionCount: 1,
  recentMemories: [],
}

describe('getVendorTools', () => {
  beforeEach(() => jest.clearAllMocks())

  const tools = getVendorTools(mockCtx)

  describe('get_vendor_list', () => {
    it('returns vendors from service', async () => {
      const vendors = [
        { id: 'v1', name: 'Photo Pro', category: 'PHOTOGRAPHER', quotes: [] },
        { id: 'v2', name: 'DJ Mix', category: 'MUSIC', quotes: [] },
      ]
      mockVendorService.getVendors.mockResolvedValue(vendors)

      const result = await tools.get_vendor_list.execute({}, { toolCallId: 'tc1', messages: [], abortSignal: undefined as never })

      expect(mockVendorService.getVendors).toHaveBeenCalledWith('wedding-123', undefined)
      expect(result).toEqual({ vendors })
    })

    it('passes category filter', async () => {
      mockVendorService.getVendors.mockResolvedValue([])

      await tools.get_vendor_list.execute(
        { category: 'VENUE' },
        { toolCallId: 'tc2', messages: [], abortSignal: undefined as never }
      )

      expect(mockVendorService.getVendors).toHaveBeenCalledWith('wedding-123', 'VENUE')
    })
  })

  describe('add_vendor', () => {
    it('creates a pending T1 suggestion, not a vendor directly', async () => {
      mockDb.ettaSuggestion.create.mockResolvedValue({ id: 'sug-1' })

      const params = {
        name: 'Great Caterer',
        category: 'CATERING' as const,
        contactName: 'Chef Bob',
        contactEmail: 'bob@catering.com',
      }

      const result = await tools.add_vendor.execute(params, { toolCallId: 'tc3', messages: [], abortSignal: undefined as never })

      expect(mockDb.ettaSuggestion.create).toHaveBeenCalledWith({
        data: {
          weddingId: 'wedding-123',
          actorId: 'actor-123',
          actionType: 'add_vendor',
          tier: 'T1',
          payload: params,
          summary: 'Add vendor: Great Caterer (CATERING)',
          status: 'pending',
        },
      })
      expect(result).toEqual({
        status: 'pending',
        message: 'Vendor suggestion created for review',
        suggestionId: 'sug-1',
      })
    })

    it('returns suggestion ID', async () => {
      mockDb.ettaSuggestion.create.mockResolvedValue({ id: 'sug-42' })

      const result = await tools.add_vendor.execute(
        { name: 'DJ Cool', category: 'MUSIC' as const },
        { toolCallId: 'tc4', messages: [], abortSignal: undefined as never }
      )

      expect(result.suggestionId).toBe('sug-42')
    })
  })
})
