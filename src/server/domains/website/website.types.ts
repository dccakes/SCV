/**
 * Website Domain - Types
 *
 * Type definitions for the Website domain entity.
 * Represents the public wedding website configuration.
 */

import { type Question } from '~/app/utils/shared-types'

/**
 * Core Website entity type
 */
export type Website = {
  id: string
  createdAt: Date
  updatedAt: Date
  userId: string
  url: string
  subUrl: string
  groomFirstName: string
  groomLastName: string
  brideFirstName: string
  brideLastName: string
  isPasswordEnabled: boolean
  password: string | null
  isRsvpEnabled: boolean
  coverPhotoUrl: string | null
}

/**
 * Website with general questions included
 */
export type WebsiteWithQuestions = Website & {
  generalQuestions: Question[]
}

/**
 * Input for creating a new website (during initial setup)
 */
export type CreateWebsiteInput = {
  userId: string
  firstName: string
  middleName?: string
  lastName: string
  partnerFirstName: string
  partnerMiddleName?: string
  partnerLastName: string
  basePath: string
  email: string
  hasWeddingDetails?: boolean
  weddingDate?: string
  weddingLocation?: string
}

/**
 * Input for updating website settings
 */
export type UpdateWebsiteInput = {
  isPasswordEnabled?: boolean
  password?: string
  basePath?: string
  subUrl?: string
}

/**
 * Input for updating RSVP enabled status
 */
export type UpdateRsvpEnabledInput = {
  websiteId: string
  isRsvpEnabled: boolean
}

/**
 * Input for updating cover photo
 */
export type UpdateCoverPhotoInput = {
  userId: string
  coverPhotoUrl: string | null
}

/**
 * Wedding date formatted for display
 */
export type WeddingDate = {
  standardFormat: string | undefined
  numberFormat: string | undefined
}

/**
 * Complete wedding data for public website display
 */
export type WeddingPageData = {
  groomFirstName: string | null
  groomLastName: string | null
  brideFirstName: string | null
  brideLastName: string | null
  date: WeddingDate
  website: WebsiteWithQuestions
  daysRemaining: number
  events: Array<{
    id: string
    name: string
    date: Date | null
    startTime: string | null
    endTime: string | null
    venue: string | null
    attire: string | null
    description: string | null
    userId: string
    collectRsvp: boolean
    questions: Question[]
  }>
}
