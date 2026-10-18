import { formatCurrency } from '~/components/budget/format'
import type { VendorWithQuotes } from '~/server/domains/vendor/vendor.types'

export type VendorCategory = VendorWithQuotes['category']

export const VENDOR_CATEGORY_ORDER = [
  'VENUE',
  'CATERING',
  'PHOTOGRAPHER',
  'VIDEOGRAPHER',
  'MUSIC',
  'FLOWERS',
  'ACCOMMODATION',
  'OTHER',
] satisfies VendorCategory[]

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  VENUE: 'Venue',
  CATERING: 'Catering',
  PHOTOGRAPHER: 'Photographer',
  VIDEOGRAPHER: 'Videographer',
  MUSIC: 'Music',
  FLOWERS: 'Flowers',
  ACCOMMODATION: 'Accommodation',
  OTHER: 'Other',
}

export const STATUS_SORT_ORDER: Record<VendorWithQuotes['status'], number> = {
  SELECTED: 0,
  IN_NEGOTIATION: 1,
  PRE_SELECTED: 2,
  IN_REVIEW: 3,
  NOT_AVAILABLE: 4,
  DECLINED: 5,
}

const DECIDING_STATUSES: ReadonlyArray<VendorWithQuotes['status']> = [
  'IN_REVIEW',
  'PRE_SELECTED',
  'IN_NEGOTIATION',
]

const INACTIVE_STATUSES: ReadonlyArray<VendorWithQuotes['status']> = ['DECLINED', 'NOT_AVAILABLE']

export type VendorSummary = {
  booked: number
  deciding: number
  /** Core categories (everything but Other) with no active vendor yet. */
  categoriesToFill: number
}

export function summarizeVendors(vendors: VendorWithQuotes[]): VendorSummary {
  const activeCategories = new Set(
    vendors
      .filter((vendor) => !INACTIVE_STATUSES.includes(vendor.status))
      .map((vendor) => vendor.category)
  )

  return {
    booked: vendors.filter((vendor) => vendor.status === 'SELECTED').length,
    deciding: vendors.filter((vendor) => DECIDING_STATUSES.includes(vendor.status)).length,
    categoriesToFill: VENDOR_CATEGORY_ORDER.filter(
      (category) => category !== 'OTHER' && !activeCategories.has(category)
    ).length,
  }
}

export type CategoryCount = {
  category: VendorCategory
  label: string
  count: number
}

export function countVendorsByCategory(vendors: VendorWithQuotes[]): CategoryCount[] {
  return VENDOR_CATEGORY_ORDER.map((category) => ({
    category,
    label: VENDOR_CATEGORY_LABELS[category],
    count: vendors.filter((vendor) => vendor.category === category).length,
  }))
}

export type QuoteSummary = {
  price: string
  basis: string
}

export function getQuoteSummary(vendor: VendorWithQuotes, currency: string): QuoteSummary | null {
  const [lowest] = [...vendor.quotes].sort((left, right) => left.price - right.price)

  if (!lowest) {
    return null
  }

  const basis = lowest.quoteType === 'PER_GUEST' ? 'Per guest' : 'Flat fee'

  return {
    price: formatCurrency(lowest.price, currency),
    basis: vendor.quotes.length > 1 ? `${basis} · lowest of ${vendor.quotes.length} quotes` : basis,
  }
}
