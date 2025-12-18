/**
 * Self-Fill Domain - Validators
 *
 * Zod schemas for validating self-fill guest registration inputs.
 */

import { z } from 'zod'

/**
 * Schema for fetching wedding data by self-fill token
 */
export const getByTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export type GetByTokenSchemaInput = z.infer<typeof getByTokenSchema>

/**
 * Schema for guest self-registration
 */
export const selfFillGuestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z
    .string()
    .email('Please enter a valid email address')
    .nullish()
    .or(z.literal('')),
  phone: z.string().max(20).nullish(),
})

export type SelfFillGuestSchemaInput = z.infer<typeof selfFillGuestSchema>

/**
 * Schema for generating a new self-fill token
 */
export const generateTokenSchema = z.object({})

export type GenerateTokenSchemaInput = z.infer<typeof generateTokenSchema>

/**
 * Schema for revoking a self-fill token
 */
export const revokeTokenSchema = z.object({})

export type RevokeTokenSchemaInput = z.infer<typeof revokeTokenSchema>
