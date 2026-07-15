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

  const { data: vendors, refetch } = api.vendor.getAll.useQuery({}, { initialData: initialVendors })

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
            <p className='font-mono text-[0.62rem] text-muted-foreground uppercase tracking-widest'>
              {allVendors.length} {allVendors.length === 1 ? 'vendor' : 'vendors'}
            </p>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => setShowAddForm(true)}
              className='rounded-sm border-primary/30 border-dashed font-mono text-[0.58rem] text-primary uppercase tracking-wider hover:border-primary hover:bg-primary/5'
            >
              + Add Vendor
            </Button>
          </div>
          {populatedCategories.map((category) => (
            <VendorCategorySection
              key={category}
              category={category}
              vendors={vendorsByCategory(category)}
              onViewDetails={handleViewDetails}
              onRefresh={() => refetch()}
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
              void refetch()
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      <VendorDetailPanel vendor={detailVendor} onClose={handleCloseDetail} />
    </div>
  )
}
