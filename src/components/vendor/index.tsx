'use client'

import { useMemo, useState } from 'react'
import { useDomainSuggestions } from '~/components/etta/use-domain-suggestions'
import { VendorCategorySection } from '~/components/vendor/vendor-category-section'
import { VendorDetailPanel } from '~/components/vendor/vendor-detail-panel'
import type { EttaSuggestionView } from '~/lib/etta/types'
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
  'OTHER',
] satisfies VendorCategory[]

type VendorListProps = {
  initialSuggestions: EttaSuggestionView[]
  initialVendors: VendorWithQuotes[]
}

export default function VendorList({ initialSuggestions, initialVendors }: VendorListProps) {
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)

  const { data: vendors, refetch } = api.vendor.getAll.useQuery({}, { initialData: initialVendors })
  const suggestions = useDomainSuggestions('vendors', initialSuggestions)

  const detailVendor = selectedVendorId
    ? ((vendors ?? []).find((v) => v.id === selectedVendorId) ?? null)
    : null

  const handleViewDetails = (vendorId: string) => {
    setSelectedVendorId(vendorId)
  }

  const handleCloseDetail = () => {
    setSelectedVendorId(null)
  }

  const vendorsByCategory = useMemo(() => {
    const grouped = new Map<VendorCategory, VendorWithQuotes[]>()

    for (const vendor of vendors ?? []) {
      const current = grouped.get(vendor.category) ?? []
      current.push(vendor)
      grouped.set(vendor.category, current)
    }

    return grouped
  }, [vendors])

  const suggestionsByCategory = useMemo(() => {
    const grouped = new Map<VendorCategory, EttaSuggestionView[]>()

    for (const suggestion of suggestions) {
      const payloadCategory =
        typeof suggestion.payload === 'object' &&
        suggestion.payload !== null &&
        'category' in suggestion.payload
          ? suggestion.payload.category
          : undefined

      if (!payloadCategory) {
        continue
      }

      const category = payloadCategory as VendorCategory
      const current = grouped.get(category) ?? []
      current.push(suggestion)
      grouped.set(category, current)
    }

    return grouped
  }, [suggestions])

  return (
    <div>
      <div className='mb-8 flex items-center justify-between'>
        <h1 className='font-light text-3xl text-foreground tracking-wide'>Vendors</h1>
      </div>

      {CATEGORY_ORDER.map((category) => (
        <VendorCategorySection
          key={category}
          category={category}
          suggestions={suggestionsByCategory.get(category) ?? []}
          vendors={vendorsByCategory.get(category) ?? []}
          onViewDetails={handleViewDetails}
          onRefresh={() => refetch()}
        />
      ))}

      <VendorDetailPanel vendor={detailVendor} onClose={handleCloseDetail} />
    </div>
  )
}
