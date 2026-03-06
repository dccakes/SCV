/**
 * Self-Fill Domain - Validators
 *
 * Zod schemas for validating self-fill guest registration inputs.
 */

import { z } from 'zod'

/**
 * Token must be a 32-character lowercase hex string (output of randomBytes(16).toString('hex')).
 * Trimmed before validation to reject whitespace-padded inputs.
 */
const tokenSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{32}$/, 'Invalid token format')

/**
 * Name fields must not contain HTML injection characters (< or >).
 * Allows letters (including accented/unicode), spaces, hyphens, apostrophes, and periods.
 */
const nameSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(100, `${label} must be 100 characters or fewer`)
    .refine((val) => !/[<>]/.test(val), `${label} contains invalid characters`)

/**
 * Schema for fetching wedding data by self-fill token
 */
export const getByTokenSchema = z.object({
  token: tokenSchema,
})

export type GetByTokenSchemaInput = z.infer<typeof getByTokenSchema>

/**
 * Schema for guest self-registration
 */
export const selfFillGuestSchema = z.object({
  token: tokenSchema,
  firstName: nameSchema('First name'),
  lastName: nameSchema('Last name'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .transform((v) => v.toLowerCase()),
  phone: z.string().max(20).nullish(),
  address1: z.string().trim().max(200).nullish(),
  address2: z.string().trim().max(200).nullish(),
  city: z.string().trim().max(100).nullish(),
  state: z.string().trim().max(100).nullish(),
  zipCode: z.string().trim().max(20).nullish(),
  country: z.string().trim().max(100).nullish(),
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
