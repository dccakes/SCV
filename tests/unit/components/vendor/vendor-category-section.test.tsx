import { VendorCategory, VendorStatus } from '@prisma/client'
import { fireEvent, render, screen } from '@testing-library/react'

import { VendorCategorySection } from '~/components/vendor/vendor-category-section'

const mockVendorCard = jest.fn(
  ({
    vendor,
  }: {
    vendor: {
      id: string
      name: string
      status: VendorStatus
    }
  }) => <div data-testid='vendor-card'>{vendor.name}</div>
)

const mockVendorForm = jest.fn(() => <div data-testid='vendor-form'>Vendor Form</div>)
const mockCategoryConfigEditor = jest.fn(({ open }: { open: boolean }) =>
  open ? <div data-testid='category-config-editor'>Config</div> : null
)

jest.mock('~/components/vendor/vendor-card', () => ({
  VendorCard: (props: unknown) => mockVendorCard(props as never),
}))

jest.mock('~/components/vendor/vendor-form', () => ({
  VendorForm: (props: unknown) => mockVendorForm(props as never),
}))

jest.mock('~/components/vendor/vendor-category-config-editor', () => ({
  VendorCategoryConfigEditor: (props: unknown) => mockCategoryConfigEditor(props as never),
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
  quotes: Array<{ id: string; price: number }>
  contacted: boolean
  notes: string | null
  customFields: Record<string, string> | null
}

function makeVendor(overrides: Partial<TestVendor>): TestVendor {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    weddingId: 'wedding-1',
    category: overrides.category ?? VendorCategory.CATERING,
    name: overrides.name ?? 'Vendor',
    location: null,
    website: null,
    instagram: null,
    status: overrides.status ?? VendorStatus.IN_REVIEW,
    contactName: null,
    contactEmail: null,
    contactPhone: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-01-01T00:00:00.000Z'),
    quotes: [],
    contacted: false,
    notes: null,
    customFields: null,
  }
}

describe('VendorCategorySection', () => {
  beforeEach(() => {
    mockVendorCard.mockClear()
    mockVendorForm.mockClear()
    mockCategoryConfigEditor.mockClear()
  })

  it('sorts vendors by status priority and bottom-group recency before rendering', () => {
    render(
      <VendorCategorySection
        category={VendorCategory.CATERING}
        vendors={
          [
            makeVendor({
              id: 'declined-older',
              name: 'Declined Older',
              status: VendorStatus.DECLINED,
              updatedAt: new Date('2026-01-02T00:00:00.000Z'),
            }),
            makeVendor({
              id: 'review',
              name: 'Review',
              status: VendorStatus.IN_REVIEW,
              updatedAt: new Date('2026-01-05T00:00:00.000Z'),
            }),
            makeVendor({
              id: 'selected',
              name: 'Selected',
              status: VendorStatus.SELECTED,
              updatedAt: new Date('2026-01-03T00:00:00.000Z'),
            }),
            makeVendor({
              id: 'not-available-newer',
              name: 'Not Available Newer',
              status: VendorStatus.NOT_AVAILABLE,
              updatedAt: new Date('2026-01-06T00:00:00.000Z'),
            }),
            makeVendor({
              id: 'pre-selected',
              name: 'Pre Selected',
              status: VendorStatus.PRE_SELECTED,
              updatedAt: new Date('2026-01-04T00:00:00.000Z'),
            }),
            makeVendor({
              id: 'declined-newer',
              name: 'Declined Newer',
              status: VendorStatus.DECLINED,
              updatedAt: new Date('2026-01-07T00:00:00.000Z'),
            }),
          ] as never
        }
        onViewDetails={jest.fn()}
        onRefresh={jest.fn()}
      />
    )

    expect(screen.getAllByTestId('vendor-card').map((node) => node.textContent)).toEqual([
      'Selected',
      'Pre Selected',
      'Review',
      'Not Available Newer',
      'Declined Newer',
      'Declined Older',
    ])
  })

  it('opens the category customization editor from the section header', () => {
    render(
      <VendorCategorySection
        category={VendorCategory.FLOWERS}
        vendors={[] as never}
        onViewDetails={jest.fn()}
        onRefresh={jest.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /customize category/i }))

    expect(screen.getByTestId('category-config-editor')).toBeInTheDocument()
    expect(mockCategoryConfigEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        category: VendorCategory.FLOWERS,
        open: true,
      })
    )
  })
})
