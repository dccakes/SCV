/**
 * Vendor Domain - Validators
 *
 * Zod schemas for validating vendor-related inputs.
 * These are the single source of truth for input types.
 */

import { VendorCategory, VendorStatus } from '@prisma/client'
import { z } from 'zod'

const vendorCategoryValues = Object.values(VendorCategory) as [string, ...string[]]
const vendorStatusValues = Object.values(VendorStatus) as [string, ...string[]]

// ─── Vendor schemas ───────────────────────────────────────────────────────────

export const createVendorSchema = z.object({
  category: z.enum(vendorCategoryValues as [VendorCategory, ...VendorCategory[]]),
  name: z.string().min(1, 'Vendor name is required').max(100, 'Name must be 100 characters or less'),
  location: z.string().max(200, 'Location must be 200 characters or less').optional(),
  website: z.string().max(500).url('Must be a valid URL').optional().or(z.literal('')),
  instagram: z.string().max(100, 'Instagram handle must be 100 characters or less').optional(),
  contactName: z.string().max(100, 'Contact name must be 100 characters or less').optional(),
  contactEmail: z.string().max(254).email('Must be a valid email').optional().or(z.literal('')),
  contactPhone: z.string().max(30, 'Phone must be 30 characters or less').optional(),
})

export const updateVendorSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  name: z.string().min(1).max(100).optional(),
  location: z.string().max(200).optional(),
  website: z.string().max(500).url('Must be a valid URL').optional().or(z.literal('')),
  instagram: z.string().max(100).optional(),
  contactName: z.string().max(100).optional(),
  contactEmail: z.string().max(254).email('Must be a valid email').optional().or(z.literal('')),
  contactPhone: z.string().max(30).optional(),
})

export const updateVendorStatusSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  status: z.enum(vendorStatusValues as [VendorStatus, ...VendorStatus[]]),
})

export const deleteVendorSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
})

export const getVendorSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
})

export const getVendorsByCategorySchema = z.object({
  category: z.enum(vendorCategoryValues as [VendorCategory, ...VendorCategory[]]).optional(),
})

// ─── Quote schemas ────────────────────────────────────────────────────────────

const quoteDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')

export const createQuoteSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  price: z.number().positive('Price must be greater than zero').max(10_000_000, 'Price must be less than $10,000,000'),
  quoteDate: quoteDateSchema,
  notes: z.string().max(5000, 'Notes must be 5000 characters or less').optional(),
})

export const updateQuoteSchema = z.object({
  quoteId: z.string().min(1, 'Quote ID is required'),
  vendorId: z.string().min(1, 'Vendor ID is required'),
  price: z.number().positive('Price must be greater than zero').max(10_000_000, 'Price must be less than $10,000,000').optional(),
  quoteDate: quoteDateSchema.optional(),
  notes: z.string().max(5000, 'Notes must be 5000 characters or less').optional(),
})

export const deleteQuoteSchema = z.object({
  quoteId: z.string().min(1, 'Quote ID is required'),
  vendorId: z.string().min(1, 'Vendor ID is required'),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateVendorInput = z.infer<typeof createVendorSchema>
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>
export type UpdateVendorStatusInput = z.infer<typeof updateVendorStatusSchema>
export type DeleteVendorInput = z.infer<typeof deleteVendorSchema>
export type GetVendorsByCategoryInput = z.infer<typeof getVendorsByCategorySchema>
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>
export type DeleteQuoteInput = z.infer<typeof deleteQuoteSchema>
