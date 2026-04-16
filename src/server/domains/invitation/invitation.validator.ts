/**
 * Invitation Domain - Validators
 *
 * Zod schemas for validating invitation-related inputs.
 */

import { z } from 'zod'

/**
 * Schema for creating an invitation
 */
export const createInvitationSchema = z.object({
  guestId: z.number(),
  eventId: z.string().min(1, 'Event ID is required'),
  rsvp: z.string(),
})

/**
 * Schema for updating an invitation
 */
export const updateInvitationSchema = z.object({
  guestId: z.number(),
  eventId: z.string().min(1, 'Event ID is required'),
  rsvp: z.string(),
})

/**
 * Schema for invitation ID (compound key)
 */
export const invitationIdSchema = z.object({
  guestId: z.number(),
  eventId: z.string().min(1, 'Event ID is required'),
})

/**
 * Schema for bulk updating invitations
 */
export const bulkUpdateInvitationsSchema = z.object({
  invitations: z.array(updateInvitationSchema).min(1),
})

// Export inferred types
export type CreateInvitationSchemaInput = z.infer<typeof createInvitationSchema>
export type UpdateInvitationSchemaInput = z.infer<typeof updateInvitationSchema>
export type InvitationIdSchemaInput = z.infer<typeof invitationIdSchema>
export type BulkUpdateInvitationsSchemaInput = z.infer<typeof bulkUpdateInvitationsSchema>
