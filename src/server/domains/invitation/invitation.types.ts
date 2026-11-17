/**
 * Invitation Domain - Types
 *
 * Type definitions for the Invitation domain entity.
 * Invitations track event invitations and RSVP responses.
 */

/**
 * Core Invitation entity type
 */
export type Invitation = {
  id: string
  weddingId: string
  guestId: number
  eventId: string
  rsvp: string
  dietaryRestrictions: string | null
  submittedBy: number | null
  submittedAt: Date | null
  invitedAt: Date
  sentAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Input for creating a new invitation
 */
export type CreateInvitationInput = {
  guestId: number
  eventId: string
  rsvp: string
}

/**
 * Input for updating an invitation RSVP
 */
export type UpdateInvitationInput = {
  guestId: number
  eventId: string
  rsvp: string
}

/**
 * Input for marking (or unmarking) a household's invitations to one event as sent
 */
export type SetHouseholdInvitationSentInput = {
  householdId: string
  eventId: string
  sent: boolean
}

/**
 * Input for bulk updating invitations
 */
export type BulkUpdateInvitationsInput = {
  invitations: UpdateInvitationInput[]
}

/**
 * RSVP statistics for an event
 */
export type RsvpStats = {
  attending: number
  invited: number
  declined: number
  notInvited: number
}
