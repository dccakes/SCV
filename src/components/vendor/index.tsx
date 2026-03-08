'use client'

import { VendorCategory } from '@prisma/client'
import { useState } from 'react'

import { VendorCategorySection } from '~/components/vendor/vendor-category-section'
import { VendorDetailPanel } from '~/components/vendor/vendor-detail-panel'
import type { VendorWithQuotes } from '~/server/domains/vendor/vendor.types'
import { api } from '~/trpc/react'

const CATEGORY_ORDER: VendorCategory[] = [
  VendorCategory.VENUE,
  VendorCategory.CATERING,
  VendorCategory.PHOTOGRAPHER,
  VendorCategory.VIDEOGRAPHER,
  VendorCategory.MUSIC,
  VendorCategory.FLOWERS,
  VendorCategory.OTHER,
]

type VendorListProps = {
  initialVendors: VendorWithQuotes[]
}

export default function VendorList({ initialVendors }: VendorListProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)

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

  return (
    <div>
      <div className='mb-8 flex items-center justify-between'>
        <h1 className='font-light text-3xl text-foreground tracking-wide'>Vendors</h1>
      </div>

      {CATEGORY_ORDER.map((category) => (
        <VendorCategorySection
          key={category}
          category={category}
          vendors={vendorsByCategory(category)}
          onViewDetails={handleViewDetails}
          onRefresh={() => refetch()}
        />
      ))}

      <VendorDetailPanel vendor={detailVendor} onClose={handleCloseDetail} />
    </div>
  )
}
