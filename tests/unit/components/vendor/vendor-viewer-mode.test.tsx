import { VendorCategory, VendorStatus } from '@prisma/client'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

import { WorkspaceCapabilitiesProvider } from '~/components/contexts/workspace-capabilities-context'
import VendorList from '~/components/vendor'
import { VendorCard } from '~/components/vendor/vendor-card'
import { VendorCategorySection } from '~/components/vendor/vendor-category-section'
import { VendorCustomFields } from '~/components/vendor/vendor-custom-fields'
import type { VendorWithQuotes } from '~/server/domains/vendor/vendor.types'

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

jest.mock('~/trpc/react', () => ({
  api: {
    useUtils: () => ({ vendor: { getAll: { invalidate: jest.fn() } } }),
    vendor: {
      getAll: {
        useQuery: (_input: unknown, options: { initialData: unknown }) => ({
          data: options.initialData,
        }),
      },
      delete: { useMutation: () => ({ mutate: jest.fn(), isPending: false }) },
      setRating: { useMutation: () => ({ mutate: jest.fn(), isPending: false }) },
    },
    budget: { getOverview: { useQuery: () => ({ data: { currency: 'USD' } }) } },
  },
}))

jest.mock('~/components/vendor/vendor-category-config-editor', () => ({
  VendorCategoryConfigEditor: () => <div data-testid='category-config-editor' />,
}))
jest.mock('~/components/vendor/vendor-detail-panel', () => ({
  VendorDetailPanel: () => null,
}))
jest.mock('~/components/vendor/vendor-form', () => ({
  VendorForm: () => <div data-testid='vendor-form' />,
}))

function makeVendor(overrides: Partial<VendorWithQuotes> = {}): VendorWithQuotes {
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
    images: [],
    quotes: [],
    ratingSummary: {
      average: 4,
      ratings: [{ userId: 'u1', userLabel: 'Sam', stars: 4 }],
      currentUserRating: null,
    },
    ...overrides,
  } as VendorWithQuotes
}

const wrap = (canEditPlanning: boolean, children: ReactNode) =>
  render(
    <WorkspaceCapabilitiesProvider canEditPlanning={canEditPlanning}>
      {children}
    </WorkspaceCapabilitiesProvider>
  )

describe('VendorCard', () => {
  const card = (
    <VendorCard
      vendor={makeVendor()}
      quotePrices={[1000]}
      currency='USD'
      onViewDetails={jest.fn()}
      onDeleted={jest.fn()}
    />
  )

  it('hides rating and delete controls for viewers but keeps the card readable', () => {
    wrap(false, card)

    expect(screen.queryByRole('button', { name: /rate \d star/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove dragonfire/i })).not.toBeInTheDocument()
    expect(screen.getByText('Dragonfire Catering')).toBeInTheDocument()
    expect(screen.getByText('4.0 avg')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view dragonfire catering details/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /toggle ratings breakdown/i })).toBeInTheDocument()
  })

  it('shows rating and delete controls for editors', () => {
    wrap(true, card)

    expect(screen.getAllByRole('button', { name: /rate \d star/i })).toHaveLength(5)
    expect(screen.getByRole('button', { name: /remove dragonfire/i })).toBeInTheDocument()
  })
})

describe('VendorCategorySection', () => {
  const section = (
    <VendorCategorySection
      category={VendorCategory.CATERING}
      vendors={[makeVendor()]}
      currency='USD'
      onViewDetails={jest.fn()}
      onRefresh={jest.fn()}
    />
  )

  it('hides add vendor and customize category for viewers', () => {
    wrap(false, section)

    expect(screen.queryByRole('button', { name: /add vendor/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /customize category/i })).not.toBeInTheDocument()
    expect(screen.getByText('Catering')).toBeInTheDocument()
  })

  it('shows add vendor and customize category for editors', () => {
    wrap(true, section)

    expect(screen.getByRole('button', { name: /add vendor/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /customize category/i })).toBeInTheDocument()
  })
})

describe('VendorList', () => {
  it('hides add buttons for viewers in the empty state', () => {
    wrap(false, <VendorList initialVendors={[]} />)

    expect(screen.getByText('No vendors yet')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add your first vendor/i })).not.toBeInTheDocument()
  })

  it('hides add buttons for viewers when vendors exist and in empty category tabs', () => {
    wrap(false, <VendorList initialVendors={[makeVendor()]} />)

    expect(screen.queryByRole('button', { name: /add vendor/i })).not.toBeInTheDocument()
  })

  it('shows add buttons for editors', () => {
    wrap(true, <VendorList initialVendors={[makeVendor()]} />)

    expect(screen.getAllByRole('button', { name: /add vendor/i }).length).toBeGreaterThan(0)
  })
})

describe('VendorCustomFields', () => {
  const definitions = [
    { key: 'guest_minimum', label: 'Guest Minimum', type: 'number' as const, displayOrder: 0 },
    { key: 'sparklers', label: 'Allows Sparklers', type: 'boolean' as const, displayOrder: 1 },
  ]

  it('renders read-only values with no inputs or save button for viewers', () => {
    wrap(
      false,
      <VendorCustomFields
        definitions={definitions}
        values={{ guest_minimum: '80', sparklers: 'true' }}
        onSave={jest.fn()}
        isSaving={false}
      />
    )

    expect(screen.getByText('Guest Minimum')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /save custom fields/i })).not.toBeInTheDocument()
  })

  it('shows a placeholder for viewers when nothing is filled in', () => {
    wrap(
      false,
      <VendorCustomFields
        definitions={definitions}
        values={null}
        onSave={jest.fn()}
        isSaving={false}
      />
    )

    expect(screen.getByText(/no custom field values/i)).toBeInTheDocument()
  })
})
