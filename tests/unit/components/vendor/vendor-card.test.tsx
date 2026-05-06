import { VendorCategory, VendorStatus } from '@prisma/client'
import { render, screen } from '@testing-library/react'

import { VendorCard } from '~/components/vendor/vendor-card'

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({
      vendor: {
        getAll: {
          invalidate: jest.fn(),
        },
      },
    }),
    vendor: {
      delete: {
        useMutation: () => ({
          mutate: jest.fn(),
          isPending: false,
        }),
      },
    },
  },
}))

type TestVendor = {
  id: string
  weddingId: string
  category: VendorCategory
  name: string
  location: string | null
  website: string | null
  instagram: string | null
  status: VendorStatus
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  createdAt: Date
  updatedAt: Date
  contacted: boolean
  images: []
  quotes: []
}

function makeVendor(overrides: Partial<TestVendor>): TestVendor {
  return {
    id: 'vendor-1',
    weddingId: 'wedding-1',
    category: VendorCategory.CATERING,
    name: 'Dragonfire Catering',
    location: 'Spokane',
    website: null,
    instagram: null,
    status: VendorStatus.IN_REVIEW,
    contactName: null,
    contactEmail: null,
    contactPhone: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    contacted: false,
    images: [],
    quotes: [],
    ...overrides,
  }
}

describe('VendorCard', () => {
  it('shows a contacted indicator when outreach has happened', () => {
    render(
      <VendorCard
        vendor={makeVendor({ contacted: true }) as never}
        quotePrices={[4200]}
        onViewDetails={jest.fn()}
        onDeleted={jest.fn()}
      />
    )

    expect(screen.getByText('Contacted')).toBeInTheDocument()
  })

  it('renders declined vendors with muted styling', () => {
    render(
      <VendorCard
        vendor={makeVendor({ status: VendorStatus.DECLINED }) as never}
        quotePrices={[]}
        onViewDetails={jest.fn()}
        onDeleted={jest.fn()}
      />
    )

    expect(screen.getByTestId('vendor-card-root')).toHaveClass('opacity-60')
    expect(screen.getByTestId('vendor-card-root')).toHaveClass('grayscale')
  })

  it('keeps active vendors at full strength', () => {
    render(
      <VendorCard
        vendor={makeVendor({ status: VendorStatus.SELECTED }) as never}
        quotePrices={[]}
        onViewDetails={jest.fn()}
        onDeleted={jest.fn()}
      />
    )

    expect(screen.getByTestId('vendor-card-root')).not.toHaveClass('opacity-60')
    expect(screen.getByTestId('vendor-card-root')).not.toHaveClass('grayscale')
  })
})
