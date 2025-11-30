/**
 * Guest Domain - Types
 *
 * Type definitions for the Guest domain entity.
 * Guests are individual wedding invitees belonging to a household.
 */

import { type GuestAgeGroup } from '@prisma/client'

import { type Invitation } from '~/server/domains/invitation/invitation.types'

/**
 * Core Guest entity type
 */
export type Guest = {
  id: number
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  householdId: string
  weddingId: string
  isPrimaryContact: boolean
  ageGroup: GuestAgeGroup | null
  guestTags?: Array<{ tagId: string }>
  createdAt: Date
  updatedAt: Date
}

/**
 * Guest with invitations included
 */
export type GuestWithInvitations = Guest & {
  invitations: Invitation[]
}

/**
 * Input for creating a new guest
 */
export type CreateGuestInput = {
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  householdId: string
  isPrimaryContact?: boolean
  ageGroup?: GuestAgeGroup | null
  tagIds?: string[]
}

/**
 * Input for updating an existing guest
 */
export type UpdateGuestInput = {
  guestId: number
  firstName?: string
  lastName?: string
  email?: string | null
  phone?: string | null
  ageGroup?: GuestAgeGroup | null
  tagIds?: string[]
}

/**
 * Input for creating a guest party member (used in household creation)
 */
export type GuestPartyInput = {
  guestId?: number
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  ageGroup?: GuestAgeGroup | null
  tagIds?: string[]
  invites: Record<string, string> // eventId -> rsvp status
}
