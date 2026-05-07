import { VendorCategory, VendorStatus } from '@prisma/client'
import { fireEvent, render, screen } from '@testing-library/react'

import { VendorCard } from '~/components/vendor/vendor-card'

jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({
      vendor: { getAll: { invalidate: jest.fn() } },
    }),
    vendor: {
      delete: { useMutation: () => ({ mutate: jest.fn(), isPending: false }) },
      setRating: { useMutation: () => ({ mutate: jest.fn(), isPending: false }) },
    },
  },
}))

const baseVendor = {
  id: 'vendor-1',
  weddingId: 'wedding-1',
  category: VendorCategory.MUSIC,
  name: 'Live Band',
  location: null,
  website: null,
  instagram: null,
  status: VendorStatus.IN_REVIEW,
  contactName: null,
  contactEmail: null,
  contactPhone: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ratingSummary: {
    average: null,
    ratings: [],
    currentUserRating: null,
  },
}

describe('VendorCard ratings', () => {
  it('hides average when no ratings exist', () => {
    render(
      <VendorCard
        vendor={baseVendor}
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
        vendor={{
          ...baseVendor,
          ratingSummary: {
            average: 4.5,
            currentUserRating: 5,
            ratings: [
              { userId: 'user-1', userLabel: 'Alex', stars: 5 },
              { userId: 'user-2', userLabel: 'Taylor', stars: 4 },
            ],
          },
        }}
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
