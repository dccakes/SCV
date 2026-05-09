/**
 * Vendor Domain - Types
 *
 * TypeScript types for the Vendor domain.
 * Entity types reflect the database shape; input types are derived from Zod schemas.
 */

import { QuoteType, VendorCategory, VendorStatus } from '@prisma/client'

export { QuoteType, VendorCategory, VendorStatus }

export type VendorFieldType = 'text' | 'number' | 'boolean'

export type VendorCustomFields = Record<string, string> | null

export type FieldDefinition = {
  key: string
  label: string
  type: VendorFieldType
  displayOrder: number
}

export type VendorFieldDefinition = FieldDefinition

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
  notes: string | null
  contacted: boolean
  customFields: VendorCustomFields
  createdAt: Date
  updatedAt: Date
}

export type VendorNoteActorType = 'couple' | 'etta'

export type VendorNote = {
  id: string
  vendorId: string
  weddingId: string
  message: string
  actorType: VendorNoteActorType
  createdAt: Date
}

export type VendorImage = {
  id: string
  vendorId: string
  url: string
  key: string
  size: number
  name: string
  isPrimary: boolean
  order: number
  source: 'manual' | 'website'
  createdAt: Date
  updatedAt: Date
}

export type VendorCategoryConfig = {
  id: string
  weddingId: string | null
  category: VendorCategory
  fieldDefinitions: FieldDefinition[]
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
  images: VendorImage[]
  ratingSummary: VendorRatingSummary
}

export type VendorRatingEntry = {
  userId: string
  userLabel: string
  stars: number
}

export type VendorRatingSummary = {
  average: number | null
  ratings: VendorRatingEntry[]
  currentUserRating: number | null
}

export type VendorRatingRecord = {
  id: string
  vendorId: string
  userId: string
  stars: number
}
