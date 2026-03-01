/**
 * Vendor Domain - Types
 *
 * TypeScript types for the Vendor domain.
 * Entity types reflect the database shape; input types are derived from Zod schemas.
 */

import { VendorCategory, VendorStatus } from '@prisma/client'

export { VendorCategory, VendorStatus }

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

export type VendorQuote = {
  id: string
  vendorId: string
  price: number
  quoteDate: Date
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type VendorWithQuotes = Vendor & {
  quotes: VendorQuote[]
}
