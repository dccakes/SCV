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

function VendorsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className='flex flex-col items-center justify-center py-20 text-center'>
      <span className='font-serif text-[4rem] text-foreground/15 leading-none' aria-hidden='true'>
        ◐
      </span>
      <h2 className='mt-5 font-serif text-foreground text-xl'>No vendors yet</h2>
      <p className='mt-2 max-w-xs font-mono text-[0.65rem] text-foreground/55 tracking-wider'>
        Track venues, caterers, photographers, and more — compare quotes and manage contacts in one
        place.
      </p>
      <button
        type='button'
        onClick={onAdd}
        className='mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-sm bg-foreground px-5 py-2.5 font-mono text-[0.62rem] text-background uppercase tracking-widest transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
      >
        + Add your first vendor
      </button>
    </div>
  )
}

export default function VendorList({ initialVendors }: VendorListProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const { data: vendors, refetch } = api.vendor.getAll.useQuery({}, { initialData: initialVendors })

  const hasVendors = (vendors ?? []).length > 0

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

  return (
    <div>
      <div className='mb-8 flex items-center justify-between'>
        <h1 className='font-light text-3xl text-foreground tracking-wide'>Vendors</h1>
      </div>

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
        <VendorsEmptyState onAdd={() => setShowAddDialog(true)} />
      )}

      <VendorDetailPanel vendor={detailVendor} onClose={handleCloseDetail} />

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle className='font-display text-xl italic'>Add Your First Vendor</DialogTitle>
          </DialogHeader>
          <VendorForm
            mode='create'
            onSuccess={() => {
              setShowAddDialog(false)
              void refetch()
            }}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
