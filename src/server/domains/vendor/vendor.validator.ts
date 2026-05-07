/**
 * Vendor Domain - Validators
 *
 * Zod schemas for validating vendor-related inputs.
 * These are the single source of truth for input types.
 */

import { QuoteType, VendorCategory, VendorStatus } from '@prisma/client'
import { z } from 'zod'

import { optionalPhoneSchemaNotNull } from '~/lib/phone/phone-validator'
import { BLOB_URL_PATTERN, MAX_FILES_PER_QUOTE, sanitizeFilename } from '~/lib/upload-config'

export const MAX_VENDOR_SCRATCHPAD_LENGTH = 5000
export const MAX_VENDOR_CUSTOM_FIELD_COUNT = 20
export const MAX_VENDOR_CUSTOM_FIELD_KEY_LENGTH = 64
export const MAX_VENDOR_CUSTOM_FIELD_VALUE_LENGTH = 500
export const MAX_VENDOR_CATEGORY_FIELD_COUNT = 20
export const MAX_VENDOR_CATEGORY_FIELD_KEY_LENGTH = 64
export const MAX_VENDOR_CATEGORY_FIELD_LABEL_LENGTH = 100

const vendorCustomFieldValueSchema = z.string().max(MAX_VENDOR_CUSTOM_FIELD_VALUE_LENGTH)
const vendorCustomFieldKeySchema = z
  .string()
  .trim()
  .min(1, 'Field key is required')
  .max(
    MAX_VENDOR_CUSTOM_FIELD_KEY_LENGTH,
    `Field key must be ${MAX_VENDOR_CUSTOM_FIELD_KEY_LENGTH} characters or less`
  )

const vendorCustomFieldsSchema = z
  .record(vendorCustomFieldKeySchema, vendorCustomFieldValueSchema)
  .refine(
    (fields) => Object.keys(fields).length <= MAX_VENDOR_CUSTOM_FIELD_COUNT,
    `Custom fields must contain ${MAX_VENDOR_CUSTOM_FIELD_COUNT} entries or fewer`
  )

// ─── Vendor schemas ───────────────────────────────────────────────────────────

export const createVendorSchema = z.object({
  category: z.enum(VendorCategory),
  name: z
    .string()
    .min(1, 'Vendor name is required')
    .max(100, 'Name must be 100 characters or less'),
  location: z.string().max(200, 'Location must be 200 characters or less').optional(),
  website: z.string().max(500).url('Must be a valid URL').optional().or(z.literal('')),
  instagram: z.string().max(100, 'Instagram handle must be 100 characters or less').optional(),
  contactName: z.string().max(100, 'Contact name must be 100 characters or less').optional(),
  contactEmail: z.string().max(254).email('Must be a valid email').optional().or(z.literal('')),
  contactPhone: optionalPhoneSchemaNotNull,
})

export const updateVendorSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  name: z.string().min(1).max(100).optional(),
  location: z.string().max(200).optional(),
  website: z.string().max(500).url('Must be a valid URL').optional().or(z.literal('')),
  instagram: z.string().max(100).optional(),
  contactName: z.string().max(100).optional(),
  contactEmail: z.string().max(254).email('Must be a valid email').optional().or(z.literal('')),
  contactPhone: optionalPhoneSchemaNotNull,
  notes: z.string().max(MAX_VENDOR_SCRATCHPAD_LENGTH).nullable().optional(),
  contacted: z.boolean().optional(),
  customFields: vendorCustomFieldsSchema.nullable().optional(),
})

export const updateVendorStatusSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  status: z.enum(VendorStatus),
})

export const deleteVendorSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
})

export const getVendorSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
})

export const getNotesSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
})

export const getVendorsByCategorySchema = z.object({
  category: z.enum(VendorCategory).optional(),
})

export const setVendorRatingSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  stars: z.number().int().min(1).max(5),
})

export const addVendorNoteSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(2000, 'Message must be 2000 characters or less'),
})

export const getCategoryConfigSchema = z.object({
  category: z.enum(VendorCategory),
})

export const fieldDefinitionSchema = z.object({
  key: vendorCustomFieldKeySchema,
  label: z
    .string()
    .trim()
    .min(1, 'Field label is required')
    .max(
      MAX_VENDOR_CATEGORY_FIELD_LABEL_LENGTH,
      `Field label must be ${MAX_VENDOR_CATEGORY_FIELD_LABEL_LENGTH} characters or less`
    ),
  type: z.enum(['text', 'number', 'boolean']),
  displayOrder: z.number().int().min(0),
})

export const upsertCategoryConfigSchema = z
  .object({
    category: z.enum(VendorCategory),
    fieldDefinitions: z.array(fieldDefinitionSchema).max(MAX_VENDOR_CATEGORY_FIELD_COUNT),
  })
  .superRefine(({ fieldDefinitions }, ctx) => {
    const seenKeys = new Set<string>()
    for (const [index, fieldDefinition] of fieldDefinitions.entries()) {
      if (seenKeys.has(fieldDefinition.key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Field keys must be unique within a category config',
          path: ['fieldDefinitions', index, 'key'],
        })
      }
      seenKeys.add(fieldDefinition.key)
    }
  })
// ─── Quote schemas ────────────────────────────────────────────────────────────

const quoteDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')

export const createQuoteSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  price: z
    .number()
    .positive('Price must be greater than zero')
    .max(10_000_000, 'Price must be less than $10,000,000'),
  quoteType: z.enum(QuoteType).default('FLAT_FEE'),
  quoteDate: quoteDateSchema,
  notes: z.string().max(5000, 'Notes must be 5000 characters or less').optional(),
})

export const updateQuoteSchema = z.object({
  quoteId: z.string().min(1, 'Quote ID is required'),
  vendorId: z.string().min(1, 'Vendor ID is required'),
  price: z
    .number()
    .positive('Price must be greater than zero')
    .max(10_000_000, 'Price must be less than $10,000,000')
    .optional(),
  quoteType: z.enum(QuoteType).optional(),
  quoteDate: quoteDateSchema.optional(),
  notes: z.string().max(5000, 'Notes must be 5000 characters or less').optional(),
})

export const deleteQuoteSchema = z.object({
  quoteId: z.string().min(1, 'Quote ID is required'),
  vendorId: z.string().min(1, 'Vendor ID is required'),
})

// ─── Quote file schemas ──────────────────────────────────────────────────────

const quoteFileSchema = z.object({
  name: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name must be 255 characters or less')
    .transform(sanitizeFilename)
    .refine((v) => v.length > 0, 'File name is invalid'),
  url: z
    .string()
    .url('Must be a valid URL')
    .refine((v) => BLOB_URL_PATTERN.test(v), 'URL must be a Vercel Blob storage URL'),
  key: z.string().min(1, 'File key is required'),
  size: z.number().int().positive('File size must be positive'),
})

export const saveQuoteFilesSchema = z.object({
  quoteId: z.string().min(1, 'Quote ID is required'),
  vendorId: z.string().min(1, 'Vendor ID is required'),
  files: z.array(quoteFileSchema).min(1, 'At least one file is required').max(MAX_FILES_PER_QUOTE),
})

export const deleteQuoteFileSchema = z.object({
  fileId: z.string().min(1, 'File ID is required'),
  quoteId: z.string().min(1, 'Quote ID is required'),
  vendorId: z.string().min(1, 'Vendor ID is required'),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateVendorInput = z.infer<typeof createVendorSchema>
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>
export type UpdateVendorStatusInput = z.infer<typeof updateVendorStatusSchema>
export type DeleteVendorInput = z.infer<typeof deleteVendorSchema>
export type GetNotesInput = z.infer<typeof getNotesSchema>
export type GetVendorsByCategoryInput = z.infer<typeof getVendorsByCategorySchema>
export type SetVendorRatingInput = z.infer<typeof setVendorRatingSchema>
export type AddVendorNoteInput = z.infer<typeof addVendorNoteSchema>
export type GetCategoryConfigInput = z.infer<typeof getCategoryConfigSchema>
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>
export type DeleteQuoteInput = z.infer<typeof deleteQuoteSchema>
export type SaveQuoteFilesInput = z.infer<typeof saveQuoteFilesSchema>
export type DeleteQuoteFileInput = z.infer<typeof deleteQuoteFileSchema>
export type FieldDefinitionInput = z.infer<typeof fieldDefinitionSchema>
export type UpsertCategoryConfigInput = z.infer<typeof upsertCategoryConfigSchema>
