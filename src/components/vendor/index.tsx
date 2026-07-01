'use client'

import { useState } from 'react'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { VendorCategorySection } from '~/components/vendor/vendor-category-section'
import { VendorDetailPanel } from '~/components/vendor/vendor-detail-panel'
import { VendorForm } from '~/components/vendor/vendor-form'
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

export default function VendorList({ initialVendors }: VendorListProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [showFirstVendorForm, setShowFirstVendorForm] = useState(false)

  const { data: vendors, refetch } = api.vendor.getAll.useQuery({}, { initialData: initialVendors })

  const detailVendor = selectedVendorId
    ? ((vendors ?? []).find((v) => v.id === selectedVendorId) ?? null)
    : null

  const handleViewDetails = (vendorId: string) => {
    setSelectedVendorId(vendorId)
  }

  const handleCloseDetail = () => {
    setSelectedVendorId(null)
  }

  const vendorsByCategory = (category: VendorCategory): VendorWithQuotes[] =>
    (vendors ?? []).filter((v) => v.category === category)

  const hasVendors = (vendors ?? []).length > 0

  return (
    <div>
      {hasVendors ? (
        CATEGORY_ORDER.map((category) => (
          <VendorCategorySection
            key={category}
            category={category}
            vendors={vendorsByCategory(category)}
            onViewDetails={handleViewDetails}
            onRefresh={() => refetch()}
          />
        ))
      ) : (
        <div className='flex flex-col items-center py-24 text-center'>
          <p className='mb-1 font-mono text-[0.6rem] text-muted-foreground uppercase tracking-widest'>
            No vendors yet
          </p>
          <p className='mb-4 font-display text-2xl italic text-foreground'>
            Start tracking your vendors
          </p>
          <p className='mb-8 max-w-sm font-mono text-[0.7rem] text-muted-foreground leading-relaxed tracking-wider'>
            Add photographers, venues, caterers, and more. Compare quotes, track status, and keep
            all your vendor details in one place.
          </p>
          <button
            type='button'
            onClick={() => setShowFirstVendorForm(true)}
            className='inline-flex min-h-[44px] items-center rounded-sm border border-primary px-4 py-2.5 font-mono text-[0.62rem] text-primary uppercase tracking-widest transition-all hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2'
          >
            + Add your first vendor
          </button>
          <Dialog open={showFirstVendorForm} onOpenChange={setShowFirstVendorForm}>
            <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-lg'>
              <DialogHeader>
                <DialogTitle className='font-display text-xl italic'>Add Vendor</DialogTitle>
              </DialogHeader>
              <VendorForm
                mode='create'
                onSuccess={() => {
                  setShowFirstVendorForm(false)
                  refetch()
                }}
                onCancel={() => setShowFirstVendorForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      <VendorDetailPanel vendor={detailVendor} onClose={handleCloseDetail} />
    </div>
  )
}
