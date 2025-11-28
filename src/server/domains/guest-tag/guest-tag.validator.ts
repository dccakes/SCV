import { z } from 'zod'

/**
 * Validation schema for creating a new guest tag
 * Note: weddingId is added by the router from the authenticated user's wedding
 */
export const createGuestTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tag name is required')
    .max(20, 'Tag name must be 20 characters or less'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code')
    .nullable()
    .optional(),
})

/**
 * Validation schema for updating a guest tag
 */
export const updateGuestTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tag name is required')
    .max(20, 'Tag name must be 20 characters or less')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code')
    .nullable()
    .optional(),
})

/**
 * Validation schema for guest tag ID
 */
export const guestTagIdSchema = z.string().uuid()
