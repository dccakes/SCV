import { QuoteType, VendorCategory, VendorStatus } from '@prisma/client'
import { fireEvent, render, screen, within } from '@testing-library/react'

import VendorList from '~/components/vendor'
import type { VendorWithQuotes } from '~/server/domains/vendor/vendor.types'

jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({ vendor: { getAll: { invalidate: jest.fn() } } }),
    vendor: {
      getAll: {
        useQuery: (_input: unknown, options: { initialData: unknown }) => ({
          data: options.initialData,
        }),
      },
    },
    budget: {
      getOverview: { useQuery: () => ({ data: { currency: 'USD' } }) },
    },
  },
}))

jest.mock('~/components/vendor/vendor-category-section', () => ({
  VendorCategorySection: ({ category }: { category: string }) => (
    <div data-testid='category-section'>{category}</div>
  ),
}))

jest.mock('~/components/vendor/vendor-detail-panel', () => ({
  VendorDetailPanel: ({ vendor }: { vendor: { name: string } | null }) =>
    vendor ? <div data-testid='detail-panel'>{vendor.name}</div> : null,
}))

jest.mock('~/components/vendor/vendor-form', () => ({
  VendorForm: () => <div data-testid='vendor-form' />,
}))

jest.mock('~/components/vendor/vendor-status-select', () => ({
  StatusBadge: ({ status }: { status: string }) => <span>{status}</span>,
}))

function makeVendor(overrides: Partial<VendorWithQuotes>): VendorWithQuotes {
  return {
    id: 'vendor',
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

const quote = (price: number) => ({
  id: `quote-${price}`,
  vendorId: 'vendor',
  price,
  quoteType: QuoteType.FLAT_FEE,
  quoteDate: new Date('2026-02-01T00:00:00.000Z'),
  notes: null,
  files: [],
  createdAt: new Date('2026-02-01T00:00:00.000Z'),
  updatedAt: new Date('2026-02-01T00:00:00.000Z'),
})

const vendors = [
  makeVendor({ id: 'venue', name: 'Swamp Chapel', category: 'VENUE', status: 'SELECTED' }),
  makeVendor({
    id: 'farquaad',
    name: 'Lord Farquaad Studios',
    location: 'Duloc',
    status: 'PRE_SELECTED',
    quotes: [quote(3200)],
  }),
  makeVendor({ id: 'mirror', name: 'Magic Mirror Media', quotes: [quote(3360), quote(3500)] }),
]

describe('VendorList', () => {
  it('summarises booked, deciding and unfilled categories', () => {
    render(<VendorList initialVendors={vendors} />)

    expect(screen.getByText('1 booked · 2 deciding · 5 categories to fill')).toBeInTheDocument()
  })

  it('shows every populated category as a section on the All tab', () => {
    render(<VendorList initialVendors={vendors} />)

    expect(screen.getByRole('button', { name: 'All 3' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByTestId('category-section').map((node) => node.textContent)).toEqual([
      'VENUE',
      'PHOTOGRAPHER',
    ])
  })

  it('compares vendors side by side when a category is chosen', () => {
    render(<VendorList initialVendors={vendors} />)

    fireEvent.click(screen.getByRole('button', { name: 'Photographer 2' }))

    expect(screen.queryByTestId('category-section')).not.toBeInTheDocument()
    const compare = screen.getByRole('region', { name: 'Compare photographer quotes' })
    const cards = within(compare).getAllByRole('article')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('Lord Farquaad Studios')
    expect(cards[0]).toHaveTextContent('$3,200')
    expect(cards[1]).toHaveTextContent('Flat fee · lowest of 2 quotes')

    fireEvent.click(within(cards[1]!).getByRole('button', { name: 'View details' }))
    expect(screen.getByTestId('detail-panel')).toHaveTextContent('Magic Mirror Media')
  })

  it('keeps empty categories reachable with an add prompt', () => {
    render(<VendorList initialVendors={vendors} />)

    fireEvent.click(screen.getByRole('button', { name: 'Flowers 0' }))

    expect(screen.getByText('No flowers vendors yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add flowers vendor' })).toBeInTheDocument()
  })
})
