/**
 * Website Section Catalog
 *
 * The canonical list of section types with their editor labels, default content
 * and ordering. This is the single source of truth used to:
 *  - seed/merge sections in the editor (so every type is always editable), and
 *  - order enabled sections on the public page.
 *
 * Pure data (no React, no server deps) — safe to import from client and server.
 */

import type {
  SectionContentByType,
  WebsiteSectionType,
} from '~/server/domains/website-section/website-section.types'
import { WebsiteSectionType as SectionType } from '~/server/domains/website-section/website-section.types'

export type SectionCatalogEntry<T extends WebsiteSectionType = WebsiteSectionType> = {
  type: T
  /** Short label shown in the editor and as the nav anchor. */
  label: string
  /** Helper copy shown in the editor. */
  description: string
  /** Canonical order on the public page. */
  position: number
  /** Whether the section is enabled by default when first created. */
  defaultEnabled: boolean
  /** Content used when the section does not yet exist. */
  defaultContent: SectionContentByType[T]
}

const entry = <T extends WebsiteSectionType>(
  value: SectionCatalogEntry<T>
): SectionCatalogEntry<T> => value

export const SECTION_CATALOG = [
  entry({
    type: SectionType.HOME,
    label: 'Welcome',
    description: 'A short intro guests see at the top of your site.',
    position: 0,
    defaultEnabled: true,
    defaultContent: { introText: '' },
  }),
  entry({
    type: SectionType.OUR_STORY,
    label: 'Our Story',
    description: 'How you met, the proposal, your journey together.',
    position: 1,
    defaultEnabled: false,
    defaultContent: { heading: 'Our Story', body: '' },
  }),
  entry({
    type: SectionType.TIMELINE,
    label: 'Story Timeline',
    description:
      'A horizontal journey of milestones — first meeting, the proposal, the celebration.',
    position: 2,
    defaultEnabled: false,
    defaultContent: {
      heading: 'Every Great Journey Has a Beginning',
      eyebrow: 'Our Story',
      milestones: [],
    },
  }),
  entry({
    type: SectionType.DESTINATION,
    label: 'The Destination',
    description: 'An editorial feature for your city and venue, with an optional image and link.',
    position: 3,
    defaultEnabled: false,
    defaultContent: {
      eyebrow: 'The Destination',
      heading: 'Your Invitation',
      body: '',
    },
  }),
  entry({
    type: SectionType.EXPERIENCES,
    label: 'Curated Experiences',
    description: 'A row of image cards for the ceremony, celebration, and other moments.',
    position: 4,
    defaultEnabled: false,
    defaultContent: { heading: 'Curated Experiences', eyebrow: 'Curated Experiences', items: [] },
  }),
  entry({
    type: SectionType.WEDDING_PARTY,
    label: 'Wedding Party',
    description: 'Introduce the people standing beside you.',
    position: 5,
    defaultEnabled: false,
    defaultContent: { heading: 'Wedding Party', members: [] },
  }),
  entry({
    type: SectionType.TRAVEL,
    label: 'Travel & Stay',
    description: 'Hotels, directions, services, and getting-around notes for guests.',
    position: 6,
    defaultEnabled: false,
    defaultContent: { heading: 'Travel & Stay', body: '' },
  }),
  entry({
    type: SectionType.FAQ,
    label: 'FAQ',
    description: 'Answer the questions guests ask most.',
    position: 7,
    defaultEnabled: false,
    defaultContent: { heading: 'Questions & Answers', items: [] },
  }),
  entry({
    type: SectionType.REGISTRY,
    label: 'Registry',
    description: 'Link out to your registries and gift preferences.',
    position: 8,
    defaultEnabled: false,
    defaultContent: { heading: 'Registry', body: '', links: [] },
  }),
  entry({
    type: SectionType.SAVE_THE_DATE,
    label: 'Save the Date Page',
    description:
      'Personalize the wording on your standalone Save the Date page. Turn on to use your own copy; off keeps the template default.',
    position: 9,
    defaultEnabled: false,
    defaultContent: {},
  }),
  entry({
    type: SectionType.INVITATION,
    label: 'Invitation Page',
    description:
      'Personalize the wording on your standalone Invitation page. Turn on to use your own copy; off keeps the template default.',
    position: 10,
    defaultEnabled: false,
    defaultContent: {},
  }),
] as const satisfies readonly SectionCatalogEntry[]

const CATALOG_BY_TYPE = new Map<WebsiteSectionType, SectionCatalogEntry>(
  SECTION_CATALOG.map((catalogEntry) => [catalogEntry.type, catalogEntry])
)

export function getSectionCatalogEntry(type: WebsiteSectionType): SectionCatalogEntry {
  const match = CATALOG_BY_TYPE.get(type)
  if (!match) {
    throw new Error(`No catalog entry for section type "${type}"`)
  }
  return match
}

/** Default position for a section type (used when creating). */
export function getSectionPosition(type: WebsiteSectionType): number {
  return getSectionCatalogEntry(type).position
}
