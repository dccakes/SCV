import type {
  VendorCategoryConfig as DomainVendorCategoryConfig,
  VendorNote as DomainVendorNote,
  VendorFieldDefinition,
  VendorFieldType,
  VendorImage,
  VendorWithQuotes,
} from '~/server/domains/vendor/vendor.types'

export type VendorCustomFieldType = VendorFieldType

export type VendorCustomFieldDefinition = VendorFieldDefinition

export type VendorCategoryConfig = Pick<
  DomainVendorCategoryConfig,
  'id' | 'category' | 'weddingId' | 'fieldDefinitions'
>

export type VendorNote = Omit<DomainVendorNote, 'createdAt'> & {
  createdAt: Date | string
}

export type VendorCustomFieldValues = Record<string, string>

export type { VendorImage }

export type EnrichedVendor = VendorWithQuotes & {
  contacted?: boolean
  notes?: string | null
  customFields?: VendorCustomFieldValues | null
  coverImage?: VendorImage | null
}

export function toSnakeCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
