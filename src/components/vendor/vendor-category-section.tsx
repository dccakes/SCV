'use client'

import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { VendorCard } from '~/components/vendor/vendor-card'
import { VendorCategoryConfigEditor } from '~/components/vendor/vendor-category-config-editor'
import { VendorForm } from '~/components/vendor/vendor-form'
import { STATUS_SORT_ORDER } from '~/components/vendor/vendor-list-view-model'
import type { VendorWithQuotes } from '~/server/domains/vendor/vendor.types'

type VendorCategory = VendorWithQuotes['category']

const CATEGORY_LABELS: Record<VendorCategory, string> = {
  VENUE: 'Venue',
  CATERING: 'Catering',
  PHOTOGRAPHER: 'Photographer',
  VIDEOGRAPHER: 'Videographer',
  MUSIC: 'Music',
  FLOWERS: 'Flowers',
  ACCOMMODATION: 'Accommodation',
  OTHER: 'Other',
}

export { STATUS_SORT_ORDER }

type VendorCategorySectionProps = {
  category: VendorCategory
  vendors: VendorWithQuotes[]
  currency: string
  onViewDetails: (vendorId: string) => void
  onRefresh: () => void
}

export function VendorCategorySection({
  category,
  vendors,
  currency,
  onViewDetails,
  onRefresh,
}: VendorCategorySectionProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCategoryConfig, setShowCategoryConfig] = useState(false)
  const sortedVendors = [...vendors].sort((left, right) => {
    const leftOrder = STATUS_SORT_ORDER[left.status]
    const rightOrder = STATUS_SORT_ORDER[right.status]
    const leftIsBottomGroup = leftOrder >= 4
    const rightIsBottomGroup = rightOrder >= 4

    if (leftIsBottomGroup || rightIsBottomGroup) {
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder
      }

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    }

    return leftOrder - rightOrder
  })

  return (
    <section className='mb-8'>
      {/* Section label with hairline rule */}
      <div className='mb-3 flex items-center gap-3'>
        <h2 className='shrink-0 font-semibold text-foreground text-lg'>
          {CATEGORY_LABELS[category]}
        </h2>
        <span className='h-px flex-1 bg-border' aria-hidden='true' />
        <Button
          size='sm'
          variant='ghost'
          className='shrink-0 text-muted-foreground hover:text-foreground'
          onClick={() => setShowCategoryConfig(true)}
        >
          Customize category
        </Button>
        <Button
          size='sm'
          variant='outline'
          className='shrink-0'
          onClick={() => setShowAddForm(true)}
        >
          Add vendor
        </Button>
      </div>

      {vendors.length === 0 && (
        <p className='py-4 text-center text-muted-foreground text-sm'>No vendors added yet</p>
      )}

      <div className='flex flex-col gap-2'>
        {sortedVendors.map((vendor) => (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            quotePrices={vendor.quotes.map((q) => q.price)}
            currency={currency}
            onViewDetails={onViewDetails}
            onDeleted={onRefresh}
          />
        ))}
      </div>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle className='font-display text-2xl'>
              Add {CATEGORY_LABELS[category]}
            </DialogTitle>
          </DialogHeader>
          <VendorForm
            mode='create'
            defaultCategory={category}
            onSuccess={() => {
              setShowAddForm(false)
              onRefresh()
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      <VendorCategoryConfigEditor
        category={category}
        open={showCategoryConfig}
        onOpenChange={setShowCategoryConfig}
      />
    </section>
  )
}
