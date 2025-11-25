/**
 * User Domain - Validators
 *
 * Zod schemas for validating user-related inputs.
 */

import { z } from 'zod'

/**
 * Schema for creating a new user
 */
export const createUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  email: z.string().email('Valid email is required'),
  websiteUrl: z.string().optional(),
  groomFirstName: z.string().optional(),
  groomLastName: z.string().optional(),
  brideFirstName: z.string().optional(),
  brideLastName: z.string().optional(),
})

/**
 * Schema for updating user profile
 */
export const updateUserSchema = z.object({
  name: z.string().optional(),
  websiteUrl: z.string().optional(),
  groomFirstName: z.string().optional(),
  groomLastName: z.string().optional(),
  brideFirstName: z.string().optional(),
  brideLastName: z.string().optional(),
})

/**
 * Schema for user ID parameter
 */
export const userIdSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
})

// Export inferred types
export type CreateUserSchemaInput = z.infer<typeof createUserSchema>
export type UpdateUserSchemaInput = z.infer<typeof updateUserSchema>
