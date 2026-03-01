'use client'

import { VendorCategory } from '@prisma/client'
import { useState } from 'react'

import { VendorCategorySection } from '~/app/_components/vendor/vendor-category-section'
import { VendorDetailPanel } from '~/app/_components/vendor/vendor-detail-panel'
import { type Vendor, type VendorWithQuotes } from '~/server/domains/vendor/vendor.types'
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
  initialVendors: Vendor[]
}

export default function VendorList({ initialVendors }: VendorListProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [detailVendor, setDetailVendor] = useState<VendorWithQuotes | null>(null)

  const { data: vendors, refetch } = api.vendor.getAll.useQuery(
    {},
    { initialData: initialVendors }
  )

  api.vendor.getById.useQuery(
    { vendorId: selectedVendorId ?? '' },
    {
      enabled: !!selectedVendorId,
      onSuccess: (data) => setDetailVendor(data ?? null),
    }
  )

  const handleViewDetails = (vendorId: string) => {
    setSelectedVendorId(vendorId)
  }

  const handleCloseDetail = () => {
    setSelectedVendorId(null)
    setDetailVendor(null)
  }

  const vendorsByCategory = (category: VendorCategory): Vendor[] =>
    (vendors ?? []).filter((v) => v.category === category)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-light tracking-wide text-gray-800">Vendors</h1>
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

      <VendorDetailPanel
        vendor={detailVendor}
        onClose={handleCloseDetail}
      />
    </div>
  )
}
