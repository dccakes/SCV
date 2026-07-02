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

type VendorListProps = {
  initialVendors: VendorWithQuotes[]
}

function VendorEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className='flex flex-col items-center justify-center py-20 text-center'>
      <p className='mb-1 font-mono text-[0.6rem] text-foreground/40 uppercase tracking-[0.18em]'>
        No vendors yet
      </p>
      <p className='mb-6 font-serif text-xl text-foreground/60 italic'>
        Track quotes, contacts &amp; contracts in one place
      </p>
      <div className='mb-8 flex flex-wrap justify-center gap-2'>
        {CATEGORY_ORDER.map((cat) => (
          <span
            key={cat}
            className='rounded-full border border-border/60 px-2.5 py-1 font-mono text-[0.58rem] text-foreground/40 uppercase tracking-widest'
          >
            {CATEGORY_LABELS[cat]}
          </span>
        ))}
      </div>
      <button
        type='button'
        onClick={onAdd}
        className='min-h-[44px] rounded-sm border border-dashed border-primary/40 px-5 py-2.5 font-mono text-[0.62rem] text-primary uppercase tracking-widest transition-all hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
      >
        + Add your first vendor
      </button>
    </div>
  )
}

export default function VendorList({ initialVendors }: VendorListProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

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

  const isEmpty = (vendors ?? []).length === 0

  return (
    <div>
      <div className='mb-8 flex items-center justify-between'>
        <h1 className='font-light text-3xl text-foreground tracking-wide'>Vendors</h1>
        {!isEmpty && (
          <button
            type='button'
            onClick={() => setShowAddForm(true)}
            className='min-h-[44px] rounded-sm border border-dashed border-primary/40 px-4 py-2 font-mono text-[0.58rem] text-primary uppercase tracking-widest transition-all hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:ring-offset-2'
          >
            + Add Vendor
          </button>
        )}
      </div>

      {isEmpty ? (
        <VendorEmptyState onAdd={() => setShowAddForm(true)} />
      ) : (
        CATEGORY_ORDER.map((category) => (
          <VendorCategorySection
            key={category}
            category={category}
            vendors={vendorsByCategory(category)}
            onViewDetails={handleViewDetails}
            onRefresh={() => refetch()}
          />
        ))
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
              refetch()
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      <VendorDetailPanel vendor={detailVendor} onClose={handleCloseDetail} />
    </div>
  )
}
