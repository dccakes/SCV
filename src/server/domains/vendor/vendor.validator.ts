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
  location: z.string().optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  instagram: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Must be a valid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
})

export const updateVendorSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  name: z.string().min(1).max(100).optional(),
  location: z.string().optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  instagram: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Must be a valid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
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

export const createQuoteSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  price: z.number().positive('Price must be greater than zero'),
  quoteDate: z.string().min(1, 'Quote date is required'),
  notes: z.string().optional(),
})

export const updateQuoteSchema = z.object({
  quoteId: z.string().min(1, 'Quote ID is required'),
  vendorId: z.string().min(1, 'Vendor ID is required'),
  price: z.number().positive('Price must be greater than zero').optional(),
  quoteDate: z.string().optional(),
  notes: z.string().optional(),
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
