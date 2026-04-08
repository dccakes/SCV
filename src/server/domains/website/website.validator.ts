/**
 * Website Domain - Validators
 *
 * Zod schemas for validating website-related inputs.
 */

import { z } from 'zod'

/**
 * Schema for enabling website add-on
 * Note: Wedding must already exist. Couple names come from Wedding entity.
 */
export const createWebsiteSchema = z.object({
  basePath: z.string().min(1, 'Base path is required'),
  email: z.string().email('Valid email is required'),
})

/**
 * Schema for RSVP form submission
 * Note: This is a cross-domain operation that will be moved to an
 * Application Service in Phase 4 (RSVP Submission Service)
 */
export const submitRsvpSchema = z.object({
  rsvpResponses: z.array(
    z.object({
      eventId: z.string(),
      guestId: z.number(),
      rsvp: z.string(),
    })
  ),
  answersToQuestions: z.array(
    z.object({
      questionId: z.string(),
      questionType: z.string(),
      response: z.string(),
      guestId: z.number().nullish(),
      householdId: z.string().nullish(),
      selectedOptionId: z.string().optional(),
      guestFirstName: z.string().optional().nullish(),
      guestLastName: z.string().optional().nullish(),
    })
  ),
})

/**
 * Schema for updating website settings
 */
export const updateWebsiteSchema = z
  .object({
    isPasswordEnabled: z.boolean().optional(),
    password: z.string().optional(),
    basePath: z.string().optional(),
    subUrl: z.string().regex(/^\w+$/, 'URL should not contain any special characters!').optional(),
  })
  .refine(
    (data) =>
      data.isPasswordEnabled !== undefined ||
      data.password !== undefined ||
      data.basePath !== undefined ||
      data.subUrl !== undefined,
    {
      message: 'At least one website setting must be provided',
    }
  )

/**
 * Schema for updating RSVP enabled status
 */
export const updateRsvpEnabledSchema = z.object({
  websiteId: z.string().min(1, 'Website ID is required'),
  isRsvpEnabled: z.boolean(),
})

/**
 * Schema for updating cover photo
 */
export const updateCoverPhotoSchema = z.object({
  coverPhotoUrl: z.string().nullable(),
})

/**
 * Schema for fetching website by subUrl
 */
export const getBySubUrlSchema = z.object({
  subUrl: z.string().nullish(),
})

/**
 * Schema for fetching wedding data
 */
export const fetchWeddingDataSchema = z.object({
  subUrl: z.string().min(1, 'Sub URL is required'),
  accessToken: z.string().optional(),
})

export const hasPasswordAccessSchema = z.object({
  subUrl: z.string().min(1, 'Sub URL is required'),
  accessToken: z.string().optional(),
})

export const verifyWebsitePasswordSchema = z.object({
  subUrl: z.string().min(1, 'Sub URL is required'),
  password: z.string().min(1, 'Password is required'),
})

/**
 * Schema for looking up households by guest name (public, no auth)
 */
export const lookupHouseholdByNameSchema = z.object({
  subUrl: z.string().min(1, 'Sub URL is required'),
  name: z.string().min(1, 'Name is required'),
})

/**
 * Schema for validating a household RSVP token
 */
export const validateRsvpTokenSchema = z.object({
  subUrl: z.string().min(1, 'Sub URL is required'),
  rsvpToken: z.string().uuid('Invalid RSVP token format'),
})

/**
 * Schema for confirming household identity via name + email
 */
export const confirmHouseholdIdentitySchema = z.object({
  subUrl: z.string().min(1, 'Sub URL is required'),
  householdId: z.string().min(1, 'Household ID is required'),
  email: z.string().email('Valid email is required'),
})

/**
 * Schema for updating primary contact info after RSVP token auth
 */
export const updateGuestContactInfoSchema = z.object({
  subUrl: z.string().min(1, 'Sub URL is required'),
  rsvpToken: z.string().uuid('Invalid RSVP token format'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
})

// Export inferred types
export type CreateWebsiteSchemaInput = z.infer<typeof createWebsiteSchema>
export type UpdateWebsiteSchemaInput = z.infer<typeof updateWebsiteSchema>
export type UpdateRsvpEnabledSchemaInput = z.infer<typeof updateRsvpEnabledSchema>
export type UpdateCoverPhotoSchemaInput = z.infer<typeof updateCoverPhotoSchema>
export type SubmitRsvpSchemaInput = z.infer<typeof submitRsvpSchema>
export type HasPasswordAccessSchemaInput = z.infer<typeof hasPasswordAccessSchema>
export type VerifyWebsitePasswordSchemaInput = z.infer<typeof verifyWebsitePasswordSchema>
export type RsvpResponse = SubmitRsvpSchemaInput['rsvpResponses'][number]
export type AnswerToQuestion = SubmitRsvpSchemaInput['answersToQuestions'][number]
export type LookupHouseholdByNameSchemaInput = z.infer<typeof lookupHouseholdByNameSchema>
export type ValidateRsvpTokenSchemaInput = z.infer<typeof validateRsvpTokenSchema>
export type ConfirmHouseholdIdentitySchemaInput = z.infer<typeof confirmHouseholdIdentitySchema>
export type UpdateGuestContactInfoSchemaInput = z.infer<typeof updateGuestContactInfoSchema>
