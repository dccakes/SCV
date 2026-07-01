'use client'

import { useState } from 'react'

import { Button } from '~/components/ui/button'
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

function NoVendorsEmptyState({ onAddVendor }: { onAddVendor: () => void }) {
  return (
    <div className='flex flex-col items-center justify-center py-20 text-center'>
      <span className='mb-5 block font-serif text-5xl text-foreground/15'>◐</span>
      <p className='mb-1 font-mono text-[0.62rem] text-foreground/40 uppercase tracking-[0.18em]'>
        No vendors yet
      </p>
      <p className='mb-6 max-w-xs font-serif text-xl text-foreground/70 italic leading-snug'>
        Track quotes, contacts, and contracts in one place.
      </p>
      <p className='mb-8 max-w-sm font-mono text-[0.62rem] text-foreground/50 leading-relaxed tracking-wider'>
        Add vendors across categories like venue, catering, photographer, florals, and more.
      </p>
      <Button onClick={onAddVendor}>Add Your First Vendor</Button>
    </div>
  )
}

export default function VendorList({ initialVendors }: VendorListProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [showAddFirstVendorDialog, setShowAddFirstVendorDialog] = useState(false)

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
        <NoVendorsEmptyState onAddVendor={() => setShowAddFirstVendorDialog(true)} />
      )}

      <Dialog open={showAddFirstVendorDialog} onOpenChange={setShowAddFirstVendorDialog}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle className='font-display text-xl italic'>Add Vendor</DialogTitle>
          </DialogHeader>
          <VendorForm
            mode='create'
            onSuccess={() => {
              setShowAddFirstVendorDialog(false)
              void refetch()
            }}
            onCancel={() => setShowAddFirstVendorDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <VendorDetailPanel vendor={detailVendor} onClose={handleCloseDetail} />
    </div>
  )
}
