/**
 * Vendor Domain - Types
 *
 * TypeScript types for the Vendor domain.
 * Entity types reflect the database shape; input types are derived from Zod schemas.
 */

import { QuoteType, VendorCategory, VendorStatus } from '@prisma/client'

export { QuoteType, VendorCategory, VendorStatus }

export type Vendor = {
  id: string
  weddingId: string
  category: VendorCategory
  name: string
  location: string | null
  website: string | null
  instagram: string | null
  status: VendorStatus
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  createdAt: Date
  updatedAt: Date
}

export type VendorQuoteFile = {
  id: string
  quoteId: string
  name: string
  url: string
  key: string
  size: number
  createdAt: Date
}

export type VendorQuote = {
  id: string
  vendorId: string
  price: number
  quoteType: QuoteType
  quoteDate: Date
  notes: string | null
  files: VendorQuoteFile[]
  createdAt: Date
  updatedAt: Date
}

export type VendorWithQuotes = Vendor & {
  quotes: VendorQuote[]
}
