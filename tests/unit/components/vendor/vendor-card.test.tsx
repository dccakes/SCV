import { VendorCategory, VendorStatus } from '@prisma/client'
import { fireEvent, render, screen } from '@testing-library/react'

import { VendorCard } from '~/components/vendor/vendor-card'
import type { VendorWithQuotes } from '~/server/domains/vendor/vendor.types'

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
      setRating: {
        useMutation: () => ({
          mutate: jest.fn(),
          isPending: false,
        }),
      },
    },
  },
}))

function makeVendor(overrides: Partial<VendorWithQuotes>): VendorWithQuotes {
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
    notes: null,
    contacted: false,
    customFields: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    quotes: [],
    ratingSummary: {
      average: null,
      ratings: [],
      currentUserRating: null,
    },
    ...overrides,
  }
}

describe('VendorCard', () => {
  it('shows a contacted indicator when outreach has happened', () => {
    render(
      <VendorCard
        vendor={makeVendor({ contacted: true })}
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
        vendor={makeVendor({ status: VendorStatus.DECLINED })}
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
        vendor={makeVendor({ status: VendorStatus.SELECTED })}
        quotePrices={[]}
        onViewDetails={jest.fn()}
        onDeleted={jest.fn()}
      />
    )

    expect(screen.getByTestId('vendor-card-root')).not.toHaveClass('opacity-60')
    expect(screen.getByTestId('vendor-card-root')).not.toHaveClass('grayscale')
  })

  it('hides average when no ratings exist', () => {
    render(
      <VendorCard
        vendor={makeVendor()}
        quotePrices={[]}
        onViewDetails={jest.fn()}
        onDeleted={jest.fn()}
      />
    )

    expect(screen.queryByText(/avg/i)).not.toBeInTheDocument()
  })

  it('renders average and reveals breakdown via touch-safe control', () => {
    render(
      <VendorCard
        vendor={makeVendor({
          ratingSummary: {
            average: 4.5,
            currentUserRating: 5,
            ratings: [
              { userId: 'user-1', userLabel: 'Alex', stars: 5 },
              { userId: 'user-2', userLabel: 'Taylor', stars: 4 },
            ],
          },
        })}
        quotePrices={[]}
        onViewDetails={jest.fn()}
        onDeleted={jest.fn()}
      />
    )

    expect(screen.getByText('4.5 avg')).toBeInTheDocument()
    const toggleButton = screen.getByRole('button', { name: /toggle ratings breakdown/i })
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByText('Alex: 5 stars').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Taylor: 4 stars').length).toBeGreaterThan(0)
  })
})
