import { QuoteType, VendorCategory, VendorStatus } from '@prisma/client'

import {
  countVendorsByCategory,
  getQuoteSummary,
  summarizeVendors,
} from '~/components/vendor/vendor-list-view-model'
import type { VendorWithQuotes } from '~/server/domains/vendor/vendor.types'

function makeVendor(overrides: Partial<VendorWithQuotes>): VendorWithQuotes {
  return {
    id: overrides.id ?? 'vendor-1',
    weddingId: 'wedding-1',
    category: VendorCategory.PHOTOGRAPHER,
    name: 'Vendor',
    location: null,
    website: null,
    instagram: null,
    status: VendorStatus.IN_REVIEW,
    contactName: null,
    contactEmail: null,
    contactPhone: null,
    notes: null,
    contacted: false,
    customFields: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    quotes: [],
    images: [],
    ratingSummary: { average: null, currentUserRating: null, ratings: [] },
    ...overrides,
  } as VendorWithQuotes
}

function makeQuote(price: number, quoteType: QuoteType) {
  return {
    id: `quote-${price}`,
    vendorId: 'vendor-1',
    price,
    quoteType,
    quoteDate: new Date('2026-02-01T00:00:00.000Z'),
    notes: null,
    files: [],
    createdAt: new Date('2026-02-01T00:00:00.000Z'),
    updatedAt: new Date('2026-02-01T00:00:00.000Z'),
  }
}

describe('vendor-list-view-model', () => {
  it('summarises booked, deciding and unfilled categories', () => {
    const summary = summarizeVendors([
      makeVendor({ id: 'a', category: VendorCategory.VENUE, status: VendorStatus.SELECTED }),
      makeVendor({
        id: 'b',
        category: VendorCategory.CATERING,
        status: VendorStatus.IN_NEGOTIATION,
      }),
      makeVendor({
        id: 'c',
        category: VendorCategory.PHOTOGRAPHER,
        status: VendorStatus.IN_REVIEW,
      }),
      makeVendor({ id: 'd', category: VendorCategory.PHOTOGRAPHER, status: VendorStatus.DECLINED }),
    ])

    expect(summary).toEqual({ booked: 1, deciding: 2, categoriesToFill: 4 })
  })

  it('counts vendors per category in display order', () => {
    const counts = countVendorsByCategory([
      makeVendor({ id: 'a', category: VendorCategory.PHOTOGRAPHER }),
      makeVendor({ id: 'b', category: VendorCategory.PHOTOGRAPHER }),
      makeVendor({ id: 'c', category: VendorCategory.VENUE }),
    ])

    expect(counts.slice(0, 3)).toEqual([
      { category: 'VENUE', label: 'Venue', count: 1 },
      { category: 'CATERING', label: 'Catering', count: 0 },
      { category: 'PHOTOGRAPHER', label: 'Photographer', count: 2 },
    ])
  })

  it('describes the lowest quote with its pricing basis', () => {
    expect(getQuoteSummary(makeVendor({ quotes: [] }), 'USD')).toBeNull()

    expect(
      getQuoteSummary(
        makeVendor({
          quotes: [makeQuote(3800, QuoteType.FLAT_FEE), makeQuote(3200, QuoteType.FLAT_FEE)],
        }),
        'USD'
      )
    ).toEqual({ price: '$3,200', basis: 'Flat fee · lowest of 2 quotes' })

    expect(
      getQuoteSummary(makeVendor({ quotes: [makeQuote(28, QuoteType.PER_GUEST)] }), 'USD')
    ).toEqual({ price: '$28', basis: 'Per guest' })
  })
})
