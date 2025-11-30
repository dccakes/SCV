/**
 * Guest Domain - Types
 *
 * Type definitions for the Guest domain entity.
 * Guests are individual wedding invitees belonging to a household.
 *
 * Note: Input types are derived from Zod schemas (single source of truth).
 * Only entity types representing database models are manually defined.
 */

import { type GuestAgeGroup } from '@prisma/client'

import {
  type CreateGuestSchemaInput,
  type GuestPartySchemaInput,
  type UpdateGuestSchemaInput,
} from '~/server/domains/guest/guest.validator'
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
 * Input types derived from Zod schemas (single source of truth)
 * These re-exports provide cleaner names and centralize type definitions
 */
export type CreateGuestInput = CreateGuestSchemaInput
export type UpdateGuestInput = UpdateGuestSchemaInput
export type GuestPartyInput = GuestPartySchemaInput
