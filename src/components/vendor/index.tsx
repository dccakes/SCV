'use client'

import { useState } from 'react'

import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { VendorCategorySection } from '~/components/vendor/vendor-category-section'
import { VendorDetailPanel } from '~/components/vendor/vendor-detail-panel'
import { VendorForm } from '~/components/vendor/vendor-form'
import { DEFAULT_CURRENCY } from '~/lib/budget/currency'
import type { VendorWithQuotes } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

type VendorCategory = VendorWithQuotes['category']

const CATEGORY_ORDER = [
  'VENUE',
  'CATERING',
  'PHOTOGRAPHER',
  'VIDEOGRAPHER',
  'MUSIC',
  'FLOWERS',
  'ACCOMMODATION',
  'OTHER',
] satisfies VendorCategory[]

type VendorListProps = {
  initialVendors: VendorWithQuotes[]
}

function VendorEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className='flex flex-col items-center gap-5 py-20 text-center'>
      <div className='flex h-16 w-16 items-center justify-center rounded-full border border-border/80 bg-muted/50'>
        <span className='text-2xl opacity-50' aria-hidden='true'>
          ◐
        </span>
      </div>
      <div className='max-w-sm'>
        <p className='font-serif text-xl text-foreground'>No vendors yet</p>
        <p className='mt-2 font-mono text-[0.65rem] text-foreground/55 leading-relaxed tracking-wider'>
          Track quotes, contacts, and contracts for your venue, caterer, photographer, and every
          other vendor in one place.
        </p>
      </div>
      <Button
        type='button'
        onClick={onAdd}
        className='font-mono text-[0.65rem] uppercase tracking-widest'
      >
        Add your first vendor
      </Button>
    </div>
  )
}

export default function VendorList({ initialVendors }: VendorListProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

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

  const populatedCategories = CATEGORY_ORDER.filter(
    (category) => vendorsByCategory(category).length > 0
  )

  return (
    <div>
      {allVendors.length === 0 ? (
        <VendorEmptyState onAdd={() => setShowAddForm(true)} />
      ) : (
        <>
          <div className='mb-6 flex items-center justify-between'>
            <p className='font-mono text-[0.62rem] text-muted-foreground tracking-wider'>
              {allVendors.length} {allVendors.length === 1 ? 'vendor' : 'vendors'} across{' '}
              {populatedCategories.length}{' '}
              {populatedCategories.length === 1 ? 'category' : 'categories'}
            </p>
            <Button
              type='button'
              size='sm'
              onClick={() => setShowAddForm(true)}
              className='font-mono text-[0.62rem] uppercase tracking-widest'
            >
              + Add Vendor
            </Button>
          </div>
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
        </>
      )}

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle className='font-display text-xl italic'>Add Vendor</DialogTitle>
          </DialogHeader>
          <VendorForm
            mode='create'
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
