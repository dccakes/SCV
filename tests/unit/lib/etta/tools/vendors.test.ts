/**
 * @jest-environment node
 */

import { TRPCError } from '@trpc/server'

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(() => ({ organizationId: 'org-1', role: 'owner' })),
}))

import { getVendorTools } from '~/lib/etta/tools/vendors'
import type { EttaContext } from '~/lib/etta/types'
import { vendorInsightsService } from '~/server/application/vendor-insights'
import { requirePermission } from '~/server/authz/permission-checker'
import { db } from '~/server/db'
import { vendorService } from '~/server/domains/vendor'

jest.mock('~/server/application/vendor-insights', () => ({
  vendorInsightsService: {
    getQuote: jest.fn(),
    listVendors: jest.fn(),
  },
}))

jest.mock('~/server/domains/vendor', () => ({
  vendorService: {
    updateQuote: jest.fn(),
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
  updateQuote: jest.Mock
}

const mockRequirePermission = requirePermission as jest.Mock
const mockVendorInsightsService = vendorInsightsService as {
  getQuote: jest.Mock
  listVendors: jest.Mock
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
  authz: {
    userId: 'user-123',
    activeOrganization: null,
  },
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
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequirePermission.mockImplementation(() => ({ organizationId: 'org-1', role: 'owner' }))
  })

  const tools = getVendorTools(mockCtx)

  describe('get_vendor_list', () => {
    it('returns vendors from service', async () => {
      const vendors = [
        { id: 'v1', name: 'Photo Pro', category: 'PHOTOGRAPHER', quotes: [] },
        { id: 'v2', name: 'DJ Mix', category: 'MUSIC', quotes: [] },
      ]
      mockVendorInsightsService.listVendors.mockResolvedValue(vendors)

      const result = await tools.get_vendor_list.execute(
        {},
        { toolCallId: 'tc1', messages: [], abortSignal: undefined as never }
      )

      expect(mockVendorInsightsService.listVendors).toHaveBeenCalledWith(
        mockCtx.authz,
        'wedding-123',
        undefined
      )
      expect(result).toEqual({ vendors })
    })

    it('passes category filter', async () => {
      mockVendorInsightsService.listVendors.mockResolvedValue([])

      await tools.get_vendor_list.execute(
        { category: 'VENUE' },
        { toolCallId: 'tc2', messages: [], abortSignal: undefined as never }
      )

      expect(mockVendorInsightsService.listVendors).toHaveBeenCalledWith(
        mockCtx.authz,
        'wedding-123',
        'VENUE'
      )
    })

    it('requires authz context', async () => {
      const toolsWithoutAuthz = getVendorTools({ ...mockCtx, authz: undefined })

      await expect(
        toolsWithoutAuthz.get_vendor_list.execute(
          {},
          { toolCallId: 'tc2b', messages: [], abortSignal: undefined as never }
        )
      ).rejects.toThrow('Authorization context required')
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

      const result = await tools.add_vendor.execute(params, {
        toolCallId: 'tc3',
        messages: [],
        abortSignal: undefined as never,
      })

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

    it('rejects viewer add_vendor when permission check fails', async () => {
      mockRequirePermission.mockImplementation(() => {
        throw new TRPCError({ code: 'FORBIDDEN' })
      })

      await expect(
        tools.add_vendor.execute(
          { name: 'No Access Vendor', category: 'MUSIC' as const },
          { toolCallId: 'tc4b', messages: [], abortSignal: undefined as never }
        )
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })

  describe('get_vendor_quote', () => {
    it('returns a single quote including files', async () => {
      const quote = {
        id: 'quote-1',
        vendorId: 'vendor-1',
        price: 2500,
        quoteType: 'FLAT_FEE',
        quoteDate: new Date('2026-04-01'),
        notes: 'Includes setup',
        files: [
          {
            id: 'file-1',
            quoteId: 'quote-1',
            name: 'proposal.pdf',
            url: 'https://files.example.com/proposal.pdf',
            key: 'proposal.pdf',
            size: 1024,
            createdAt: new Date('2026-04-01'),
          },
        ],
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-01'),
      }
      mockVendorInsightsService.getQuote.mockResolvedValue(quote)

      const result = await tools.get_vendor_quote.execute(
        { vendorId: 'vendor-1', quoteId: 'quote-1' },
        { toolCallId: 'tc5', messages: [], abortSignal: undefined as never }
      )

      expect(mockVendorInsightsService.getQuote).toHaveBeenCalledWith(
        mockCtx.authz,
        'wedding-123',
        'vendor-1',
        'quote-1'
      )
      expect(result).toEqual({ quote })
    })

    it('requires authz context', async () => {
      const toolsWithoutAuthz = getVendorTools({ ...mockCtx, authz: undefined })

      await expect(
        toolsWithoutAuthz.get_vendor_quote.execute(
          { vendorId: 'vendor-1', quoteId: 'quote-1' },
          { toolCallId: 'tc6', messages: [], abortSignal: undefined as never }
        )
      ).rejects.toThrow('Authorization context required')
    })
  })

  describe('update_vendor_quote', () => {
    it('updates a quote and returns files', async () => {
      const quote = {
        id: 'quote-1',
        vendorId: 'vendor-1',
        price: 2750,
        quoteType: 'PER_GUEST',
        quoteDate: new Date('2026-04-15'),
        notes: 'Updated package',
        files: [
          {
            id: 'file-1',
            quoteId: 'quote-1',
            name: 'proposal.pdf',
            url: 'https://files.example.com/proposal.pdf',
            key: 'proposal.pdf',
            size: 1024,
            createdAt: new Date('2026-04-01'),
          },
        ],
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-02'),
      }
      mockVendorService.updateQuote.mockResolvedValue(quote)

      const result = await tools.update_vendor_quote.execute(
        {
          vendorId: 'vendor-1',
          quoteId: 'quote-1',
          price: 2750,
          quoteType: 'PER_GUEST',
          quoteDate: '2026-04-15',
          notes: 'Updated package',
        },
        { toolCallId: 'tc7', messages: [], abortSignal: undefined as never }
      )

      expect(mockVendorService.updateQuote).toHaveBeenCalledWith(
        mockCtx.authz,
        'quote-1',
        'vendor-1',
        'wedding-123',
        {
          quoteId: 'quote-1',
          vendorId: 'vendor-1',
          price: 2750,
          quoteType: 'PER_GUEST',
          quoteDate: '2026-04-15',
          notes: 'Updated package',
        }
      )
      expect(result).toEqual({ quote })
    })

    it('requires authz context', async () => {
      const toolsWithoutAuthz = getVendorTools({ ...mockCtx, authz: undefined })

      await expect(
        toolsWithoutAuthz.update_vendor_quote.execute(
          { vendorId: 'vendor-1', quoteId: 'quote-1', notes: 'Updated package' },
          { toolCallId: 'tc8', messages: [], abortSignal: undefined as never }
        )
      ).rejects.toThrow('Authorization context required')
    })
  })
})
