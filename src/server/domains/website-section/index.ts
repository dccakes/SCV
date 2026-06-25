import { WebsiteSectionRepository } from '~/server/domains/website-section/website-section.repository'
import { WebsiteSectionService } from '~/server/domains/website-section/website-section.service'
import { db } from '~/server/infrastructure/database'

const websiteSectionRepository = new WebsiteSectionRepository(db)

export const websiteSectionService = new WebsiteSectionService(websiteSectionRepository)

export {
  SECTION_CATALOG,
  type SectionCatalogEntry,
} from '~/server/domains/website-section/website-section.catalog'
export { WebsiteSectionRepository } from '~/server/domains/website-section/website-section.repository'
export { websiteSectionRouter } from '~/server/domains/website-section/website-section.router'
export { WebsiteSectionService } from '~/server/domains/website-section/website-section.service'
export type {
  DestinationSectionContent,
  ExperienceItem,
  ExperiencesSectionContent,
  FaqSectionContent,
  HomeSectionContent,
  InvitationSectionContent,
  OurStorySectionContent,
  RegistrySectionContent,
  SaveTheDateSectionContent,
  SectionContentByType,
  TimelineMilestone,
  TimelineSectionContent,
  TravelSectionContent,
  TravelService,
  TravelStay,
  WebsiteSection,
  WebsiteSectionContent,
  WebsiteSectionType,
  WeddingPartySectionContent,
} from '~/server/domains/website-section/website-section.types'
export {
  createWebsiteSectionSchema,
  homeSectionContentSchema,
  parseSectionContent,
  type UpdateHomeSectionInput,
  type UpdateSectionInput,
  updateHomeSectionSchema,
  updateSectionSchema,
  WEBSITE_SECTION_TYPES,
} from '~/server/domains/website-section/website-section.validator'
