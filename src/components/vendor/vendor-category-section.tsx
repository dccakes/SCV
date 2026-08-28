'use client'

import { useState } from 'react'
import { SuggestionGhostItem } from '~/components/etta/SuggestionGhostItem'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { VendorCard } from '~/components/vendor/vendor-card'
import { VendorCategoryConfigEditor } from '~/components/vendor/vendor-category-config-editor'
import { VendorForm } from '~/components/vendor/vendor-form'
import type { EttaSuggestionView } from '~/lib/etta/types'
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

export const STATUS_SORT_ORDER: Record<VendorWithQuotes['status'], number> = {
  SELECTED: 0,
  IN_NEGOTIATION: 1,
  PRE_SELECTED: 2,
  IN_REVIEW: 3,
  NOT_AVAILABLE: 4,
  DECLINED: 5,
}

type VendorCategorySectionProps = {
  category: VendorCategory
  suggestions?: EttaSuggestionView[]
  vendors: VendorWithQuotes[]
  currency: string
  onViewDetails: (vendorId: string) => void
  onRefresh: () => void
}

export function VendorCategorySection({
  category,
  suggestions = [],
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
        <h2 className='shrink-0 font-mono text-[0.62rem] text-muted-foreground uppercase tracking-widest'>
          {CATEGORY_LABELS[category]}
        </h2>
        <span className='h-px flex-1 bg-border' aria-hidden='true' />
        <Button
          size='sm'
          variant='ghost'
          className='shrink-0 font-mono text-[0.58rem] text-muted-foreground uppercase tracking-wider hover:text-foreground'
          onClick={() => setShowCategoryConfig(true)}
        >
          Customize Category
        </Button>
        <Button
          size='sm'
          variant='outline'
          className='shrink-0 rounded-sm border-primary/30 border-dashed font-mono text-[0.58rem] text-primary uppercase tracking-wider hover:border-primary hover:bg-primary/5'
          onClick={() => setShowAddForm(true)}
        >
          + Add Vendor
        </Button>
      </div>

      {vendors.length === 0 && suggestions.length === 0 && (
        <p className='py-4 text-center font-mono text-[0.72rem] text-muted-foreground uppercase tracking-wider'>
          No vendors added yet
        </p>
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
        {suggestions.map((suggestion) => (
          <SuggestionGhostItem key={suggestion.id} suggestion={suggestion} />
        ))}
      </div>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle className='font-display text-xl italic'>
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
