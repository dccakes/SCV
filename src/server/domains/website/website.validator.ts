/**
 * Website Domain - Validators
 *
 * Zod schemas for validating website-related inputs.
 */

import { z } from 'zod'

/**
 * Schema for creating a new website (initial setup)
 */
export const createWebsiteSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  partnerFirstName: z.string().min(1, 'Partner first name is required'),
  partnerLastName: z.string().min(1, 'Partner last name is required'),
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
export const updateWebsiteSchema = z.object({
  isPasswordEnabled: z.boolean().optional(),
  password: z.string().optional(),
  basePath: z.string().optional(),
  subUrl: z
    .string()
    .regex(/^\w+$/, 'URL should not contain any special characters!')
    .optional(),
})

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
  userId: z.string().optional(),
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
})

// Export inferred types
export type CreateWebsiteSchemaInput = z.infer<typeof createWebsiteSchema>
export type UpdateWebsiteSchemaInput = z.infer<typeof updateWebsiteSchema>
export type UpdateRsvpEnabledSchemaInput = z.infer<typeof updateRsvpEnabledSchema>
export type UpdateCoverPhotoSchemaInput = z.infer<typeof updateCoverPhotoSchema>
export type SubmitRsvpSchemaInput = z.infer<typeof submitRsvpSchema>
export type RsvpResponse = SubmitRsvpSchemaInput['rsvpResponses'][number]
export type AnswerToQuestion = SubmitRsvpSchemaInput['answersToQuestions'][number]
