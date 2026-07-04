/**
 * Website Domain - Types
 *
 * Type definitions for the Website domain entity.
 * Represents the public wedding website configuration.
 */

import type { Question, QuestionWithOptions } from '~/server/domains/question'
import type {
  InvitationSectionContent,
  SaveTheDateSectionContent,
  WebsiteSection,
} from '~/server/domains/website-section/website-section.types'

/**
 * Core Website entity type
 */
export type Website = {
  id: string
  createdAt: Date
  updatedAt: Date
  weddingId: string
  subUrl: string
  templateId: string | null
  isPasswordEnabled: boolean
  password: string | null
  isRsvpEnabled: boolean
  coverPhotoUrl: string | null
  /** Full-width hero image shown at the top of every guest-facing surface. */
  headerImageUrl: string | null
  /** Gallery of couple photos shown on the home page. */
  coupleImageUrls: string[]
}

export type PublicWebsite = Omit<Website, 'password'> & {
  url: string
}

export type WebsiteWithComputedUrl = Website & {
  url: string
}

/**
 * Website with general questions included
 */
export type WebsiteWithQuestions = Website & {
  generalQuestions: QuestionWithOptions[]
  websiteSections?: WebsiteSection[]
}

export type PublicWebsiteWithQuestions = Omit<WebsiteWithQuestions, 'password'> & {
  url: string
}

/**
 * Input for enabling website add-on
 * Note: weddingId comes from authenticated user's wedding
 */
export type CreateWebsiteInput = {
  basePath: string
  email: string
  subUrl?: string
}

/**
 * Input for updating website settings
 */
export type UpdateWebsiteInput = {
  isPasswordEnabled?: boolean
  password?: string
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
  weddingId: string
  coverPhotoUrl: string | null
}

/**
 * Input for updating the header/hero image
 */
export type UpdateHeaderImageInput = {
  weddingId: string
  headerImageUrl: string | null
}

/**
 * Input for updating the couple photo gallery
 */
export type UpdateCoupleImagesInput = {
  weddingId: string
  coupleImageUrls: string[]
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
  websiteBuilderEnabled: boolean
  website: PublicWebsiteWithQuestions & {
    introText: string
    /** Optional hero headline + emphasised tail (HOME section, hero templates). */
    headline?: string
    headlineAccent?: string
  }
  /** Enabled content sections (excluding HOME), ordered for display. */
  sections: WebsiteSection[]
  /** Editable Save the Date page copy (when that section is enabled). */
  saveTheDate?: SaveTheDateSectionContent
  /** Editable Invitation page copy (when that section is enabled). */
  invitation?: InvitationSectionContent
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
    weddingId: string
    collectRsvp: boolean
    questions: Question[]
  }>
}
