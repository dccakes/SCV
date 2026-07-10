/**
 * Website Section — Types
 *
 * Sections are the content model behind the wedding website. Each section has a
 * `type` discriminant that determines the shape of its `content`. Templates are
 * just renderers over this data, so adding a section type here (plus its schema
 * and catalog entry) makes it available to every template at once.
 */

export const WebsiteSectionType = {
  HOME: 'HOME',
  OUR_STORY: 'OUR_STORY',
  TIMELINE: 'TIMELINE',
  DESTINATION: 'DESTINATION',
  EXPERIENCES: 'EXPERIENCES',
  WEDDING_PARTY: 'WEDDING_PARTY',
  TRAVEL: 'TRAVEL',
  FAQ: 'FAQ',
  REGISTRY: 'REGISTRY',
  SAVE_THE_DATE: 'SAVE_THE_DATE',
  INVITATION: 'INVITATION',
} as const

export type WebsiteSectionType = (typeof WebsiteSectionType)[keyof typeof WebsiteSectionType]

export type HomeSectionContent = {
  introText: string
  /**
   * Optional hero headline shown over the main image (templates with a hero,
   * e.g. Voyage). Newlines are rendered as line breaks. Falls back to the
   * template's default when empty.
   */
  headline?: string
  /** Optional emphasised tail of the headline, rendered italic in the accent colour. */
  headlineAccent?: string
}

export type OurStorySectionContent = {
  heading: string
  body: string
}

export type TimelineMilestone = {
  /** A year or short label, e.g. "2018" or "Spring". */
  year: string
  /** What happened, e.g. "First Meeting". */
  title: string
  /** Optional place, e.g. "New York, USA". */
  location?: string
}

/**
 * A horizontal journey of dated milestones — the "Our Story" timeline. Renders
 * as an editorial timeline in templates that support it.
 */
export type TimelineSectionContent = {
  heading: string
  /** Small uppercase eyebrow label shown above the heading. */
  eyebrow?: string
  milestones: TimelineMilestone[]
}

/**
 * An editorial destination block: an image paired with copy, an optional venue
 * callout and a link. Used for "Your Invitation to <place>".
 */
export type DestinationSectionContent = {
  eyebrow?: string
  heading: string
  body: string
  /** City / region, e.g. "Puebla, Mexico" — also surfaced in the hero. */
  location?: string
  /** Venue name callout, e.g. "Hacienda San José Actipan". */
  venueName?: string
  /** Short line under the venue name. */
  venueNote?: string
  /** Optional call-to-action label and URL. */
  ctaLabel?: string
  ctaUrl?: string
  /** Optional large feature image of the destination/venue. */
  imageUrl?: string
}

export type ExperienceItem = {
  title: string
  description?: string
  imageUrl?: string
}

/**
 * A row of curated image cards — ceremony, celebration, farewell, etc.
 */
export type ExperiencesSectionContent = {
  heading: string
  eyebrow?: string
  items: ExperienceItem[]
}

export type WeddingPartyMember = {
  name: string
  role: string
  /** Optional photo of the member. */
  imageUrl?: string
  /** Optional blurb about the member and their relationship to the couple. */
  blurb?: string
}

export type WeddingPartySectionContent = {
  heading: string
  members: WeddingPartyMember[]
}

export type TravelService = {
  title: string
  description: string
}

export type TravelStay = {
  name: string
  description?: string
  imageUrl?: string
  url?: string
  /** Optional longer blurb shown in the detail modal, in addition to the short card description. */
  blurb?: string
  /** Optional custom label for the link button (defaults to "Visit Website"). */
  buttonLabel?: string
}

export type TravelSectionContent = {
  heading: string
  body: string
  /** Optional thin-line service items (transfers, concierge, tips). */
  services?: TravelService[]
  /** Optional recommended places to stay, shown as cards. */
  stays?: TravelStay[]
}

export type FaqItem = {
  question: string
  answer: string
}

export type FaqSectionContent = {
  heading: string
  items: FaqItem[]
}

export type RegistryLink = {
  label: string
  url: string
}

export type RegistrySectionContent = {
  heading: string
  body: string
  links: RegistryLink[]
}

/**
 * Editable copy for the standalone Save the Date page. These are page-level
 * surfaces (not home-page sections), so they are not rendered in the home flow;
 * each field overrides the template's default wording when set.
 */
export type SaveTheDateSectionContent = {
  /** Small label above the names, e.g. "Save the Date". */
  eyebrow?: string
  /** Optional note shown beneath the date. */
  message?: string
  /** Closing line, e.g. "Formal invitation to follow.". */
  footnote?: string
}

/** Editable copy for the standalone Invitation page. */
export type InvitationSectionContent = {
  /** Opening line above the names, e.g. "Together with their families". */
  preface?: string
  /** Line beneath the names, e.g. "request the pleasure of your company". */
  invitationLine?: string
  /** Optional closing note. */
  message?: string
}

/** Maps each section type to the shape of its content. */
export type SectionContentByType = {
  HOME: HomeSectionContent
  OUR_STORY: OurStorySectionContent
  TIMELINE: TimelineSectionContent
  DESTINATION: DestinationSectionContent
  EXPERIENCES: ExperiencesSectionContent
  WEDDING_PARTY: WeddingPartySectionContent
  TRAVEL: TravelSectionContent
  FAQ: FaqSectionContent
  REGISTRY: RegistrySectionContent
  SAVE_THE_DATE: SaveTheDateSectionContent
  INVITATION: InvitationSectionContent
}

/** Any section content shape. */
export type WebsiteSectionContent = SectionContentByType[WebsiteSectionType]

type WebsiteSectionBase = {
  id: string
  websiteId: string
  isEnabled: boolean
  position: number
  createdAt: Date
  updatedAt: Date
}

/** A section narrowed to a single type, with content typed to match. */
export type WebsiteSectionOfType<T extends WebsiteSectionType> = WebsiteSectionBase & {
  type: T
  content: SectionContentByType[T]
}

/**
 * A website section as a discriminated union — switching on `type` narrows
 * `content` to the right shape.
 */
export type WebsiteSection = {
  [T in WebsiteSectionType]: WebsiteSectionOfType<T>
}[WebsiteSectionType]
