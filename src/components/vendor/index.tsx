'use client'

import { useState } from 'react'

import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { VendorCategorySection } from '~/components/vendor/vendor-category-section'
import { VendorCompareCard } from '~/components/vendor/vendor-compare-card'
import { VendorDetailPanel } from '~/components/vendor/vendor-detail-panel'
import { VendorForm } from '~/components/vendor/vendor-form'
import {
  countVendorsByCategory,
  STATUS_SORT_ORDER,
  summarizeVendors,
  VENDOR_CATEGORY_LABELS,
  VENDOR_CATEGORY_ORDER,
  type VendorCategory,
} from '~/components/vendor/vendor-list-view-model'
import { DEFAULT_CURRENCY } from '~/lib/budget/currency'
import type { VendorWithQuotes } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

type VendorListProps = {
  initialVendors: VendorWithQuotes[]
}

type CategoryFilter = VendorCategory | 'ALL'

function VendorEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className='flex flex-col items-center gap-5 py-20 text-center'>
      <div className='max-w-sm'>
        <p className='font-display text-4xl text-foreground'>No vendors yet</p>
        <p className='mt-3 text-muted-foreground text-sm leading-relaxed'>
          Track quotes, contacts, and contracts for your venue, caterer, photographer, and every
          other vendor in one place.
        </p>
      </div>
      <Button type='button' size='lg' onClick={onAdd}>
        Add your first vendor
      </Button>
    </div>
  )
}

export default function VendorList({ initialVendors }: VendorListProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL')

  const { data: vendors } = api.vendor.getAll.useQuery({}, { initialData: initialVendors })
  const { data: budgetOverview } = api.budget.getOverview.useQuery()
  const currency = budgetOverview?.currency ?? DEFAULT_CURRENCY
  const utils = api.useUtils()

  const allVendors = vendors ?? []
  const detailVendor = selectedVendorId
    ? (allVendors.find((v) => v.id === selectedVendorId) ?? null)
    : null

  const handleViewDetails = (vendorId: string) => {
    setSelectedVendorId(vendorId)
  }

  const handleCloseDetail = () => {
    setSelectedVendorId(null)
  }

  const vendorsByCategory = (category: VendorCategory): VendorWithQuotes[] =>
    allVendors.filter((v) => v.category === category)

  const populatedCategories = VENDOR_CATEGORY_ORDER.filter(
    (category) => vendorsByCategory(category).length > 0
  )
  const summary = summarizeVendors(allVendors)
  const categoryCounts = countVendorsByCategory(allVendors)
  const comparedVendors =
    categoryFilter === 'ALL'
      ? []
      : [...vendorsByCategory(categoryFilter)].sort(
          (left, right) => STATUS_SORT_ORDER[left.status] - STATUS_SORT_ORDER[right.status]
        )
  const filterLabel = categoryFilter === 'ALL' ? '' : VENDOR_CATEGORY_LABELS[categoryFilter]

  return (
    <div className='mx-auto max-w-[1120px] pb-6'>
      {allVendors.length === 0 ? (
        <VendorEmptyState onAdd={() => setShowAddForm(true)} />
      ) : (
        <div className='flex flex-col gap-7'>
          <div className='flex flex-wrap items-end justify-between gap-4'>
            <div className='flex flex-col gap-2'>
              <h2 className='font-display text-5xl text-foreground leading-none'>Your vendors</h2>
              <p className='text-muted-foreground text-sm'>
                {summary.booked} booked · {summary.deciding} deciding · {summary.categoriesToFill}{' '}
                {summary.categoriesToFill === 1 ? 'category' : 'categories'} to fill
              </p>
            </div>
            <Button type='button' onClick={() => setShowAddForm(true)}>
              Add vendor
            </Button>
          </div>

          <div className='-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible'>
            <CategoryTab
              label='All'
              count={allVendors.length}
              active={categoryFilter === 'ALL'}
              onClick={() => setCategoryFilter('ALL')}
            />
            {categoryCounts.map(({ category, label, count }) => (
              <CategoryTab
                key={category}
                label={label}
                count={count}
                active={categoryFilter === category}
                onClick={() => setCategoryFilter(category)}
              />
            ))}
          </div>

          {categoryFilter === 'ALL' ? (
            <div>
              {populatedCategories.map((category) => (
                <VendorCategorySection
                  key={category}
                  category={category}
                  vendors={vendorsByCategory(category)}
                  currency={currency}
                  onViewDetails={handleViewDetails}
                  onRefresh={() => void utils.vendor.getAll.invalidate()}
                />
              ))}
            </div>
          ) : comparedVendors.length === 0 ? (
            <div className='flex flex-col items-start gap-3 rounded-2xl border border-border border-dashed bg-card p-8'>
              <p className='font-semibold text-foreground text-lg'>
                No {filterLabel.toLowerCase()} vendors yet
              </p>
              <p className='text-muted-foreground text-sm'>
                Add the ones you are talking to and compare their quotes side by side.
              </p>
              <Button type='button' onClick={() => setShowAddForm(true)}>
                Add {filterLabel.toLowerCase()} vendor
              </Button>
            </div>
          ) : (
            <section
              aria-label={`Compare ${filterLabel.toLowerCase()} quotes`}
              className='flex flex-col gap-4'
            >
              <div className='flex flex-wrap items-baseline justify-between gap-3'>
                <h3 className='font-semibold text-foreground text-xl'>
                  {filterLabel} · {comparedVendors.length}{' '}
                  {comparedVendors.length === 1 ? 'option' : 'options'}
                </h3>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setShowAddForm(true)}
                >
                  Add {filterLabel.toLowerCase()} vendor
                </Button>
              </div>
              <div className='flex flex-wrap gap-4'>
                {comparedVendors.map((vendor) => (
                  <VendorCompareCard
                    key={vendor.id}
                    vendor={vendor}
                    currency={currency}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle className='font-display text-2xl'>
              {filterLabel ? `Add ${filterLabel.toLowerCase()} vendor` : 'Add vendor'}
            </DialogTitle>
          </DialogHeader>
          <VendorForm
            mode='create'
            defaultCategory={categoryFilter === 'ALL' ? undefined : categoryFilter}
            onSuccess={() => {
              setShowAddForm(false)
              void utils.vendor.getAll.invalidate()
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      <VendorDetailPanel vendor={detailVendor} currency={currency} onClose={handleCloseDetail} />
    </div>
  )
}

function CategoryTab({
  label,
  count,
  active,
  onClick,
}: Readonly<{ label: string; count: number; active: boolean; onClick: () => void }>) {
  return (
    <button
      type='button'
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-h-[36px] flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? 'border-foreground bg-foreground font-medium text-background'
          : `border-border bg-card hover:bg-secondary ${count === 0 ? 'text-muted-foreground' : 'text-foreground'}`
      }`}
    >
      {label}
      <span className={active ? 'text-background/70' : 'text-muted-foreground'}>{count}</span>
    </button>
  )
}
