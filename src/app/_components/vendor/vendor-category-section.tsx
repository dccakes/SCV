'use client'

import { VendorCategory } from '@prisma/client'
import { useState } from 'react'

import { VendorCard } from '~/app/_components/vendor/vendor-card'
import { VendorForm } from '~/app/_components/vendor/vendor-form'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { type VendorWithQuotes } from '~/server/domains/vendor/vendor.types'

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
  vendors: VendorWithQuotes[]
  onViewDetails: (vendorId: string) => void
  onRefresh: () => void
}

export function VendorCategorySection({
  category,
  vendors,
  onViewDetails,
  onRefresh,
}: VendorCategorySectionProps) {
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between border-b pb-2">
        <h2 className="text-lg font-semibold text-gray-800">{CATEGORY_LABELS[category]}</h2>
        <Button
          size="sm"
          variant="outline"
          className="h-7 border-pink-300 text-xs text-pink-500 hover:bg-pink-50"
          onClick={() => setShowAddForm(true)}
        >
          + Add Vendor
        </Button>
      </div>

      {vendors.length === 0 && (
        <p className="py-2 text-sm text-gray-400">No vendors added yet.</p>
      )}

      <div className="flex flex-col gap-2">
        {vendors.map((vendor) => (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            latestQuotePrice={vendor.quotes[0]?.price ?? null}
            onViewDetails={onViewDetails}
            onDeleted={onRefresh}
          />
        ))}
      </div>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add {CATEGORY_LABELS[category]}</DialogTitle>
          </DialogHeader>
          <VendorForm
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
