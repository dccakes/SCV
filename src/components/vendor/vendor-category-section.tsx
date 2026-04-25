'use client'

import { useState } from 'react'
import { SuggestionGhostItem } from '~/components/etta/SuggestionGhostItem'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { VendorCard } from '~/components/vendor/vendor-card'
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
  OTHER: 'Other',
}

type VendorCategorySectionProps = {
  category: VendorCategory
  suggestions?: EttaSuggestionView[]
  vendors: VendorWithQuotes[]
  onViewDetails: (vendorId: string) => void
  onRefresh: () => void
}

export function VendorCategorySection({
  category,
  suggestions = [],
  vendors,
  onViewDetails,
  onRefresh,
}: VendorCategorySectionProps) {
  const [showAddForm, setShowAddForm] = useState(false)

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
        {vendors.map((vendor) => (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            quotePrices={vendor.quotes.map((q) => q.price)}
            onViewDetails={onViewDetails}
            onDeleted={onRefresh}
          />
        ))}
        {suggestions.map((suggestion) => (
          <SuggestionGhostItem key={suggestion.id} suggestion={suggestion} />
        ))}
      </div>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className='max-w-lg'>
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
    </section>
  )
}
