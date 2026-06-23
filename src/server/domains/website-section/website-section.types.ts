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
  WEDDING_PARTY: 'WEDDING_PARTY',
  TRAVEL: 'TRAVEL',
  FAQ: 'FAQ',
  REGISTRY: 'REGISTRY',
} as const

export type WebsiteSectionType = (typeof WebsiteSectionType)[keyof typeof WebsiteSectionType]

export type HomeSectionContent = {
  introText: string
}

export type OurStorySectionContent = {
  heading: string
  body: string
}

export type WeddingPartyMember = {
  name: string
  role: string
}

export type WeddingPartySectionContent = {
  heading: string
  members: WeddingPartyMember[]
}

export type TravelSectionContent = {
  heading: string
  body: string
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

/** Maps each section type to the shape of its content. */
export type SectionContentByType = {
  HOME: HomeSectionContent
  OUR_STORY: OurStorySectionContent
  WEDDING_PARTY: WeddingPartySectionContent
  TRAVEL: TravelSectionContent
  FAQ: FaqSectionContent
  REGISTRY: RegistrySectionContent
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
