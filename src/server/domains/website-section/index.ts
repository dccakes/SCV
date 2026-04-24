import { WebsiteSectionRepository } from '~/server/domains/website-section/website-section.repository'
import { WebsiteSectionService } from '~/server/domains/website-section/website-section.service'
import { db } from '~/server/infrastructure/database'

const websiteSectionRepository = new WebsiteSectionRepository(db)

export const websiteSectionService = new WebsiteSectionService(websiteSectionRepository)

export { WebsiteSectionRepository } from '~/server/domains/website-section/website-section.repository'
export { websiteSectionRouter } from '~/server/domains/website-section/website-section.router'
export { WebsiteSectionService } from '~/server/domains/website-section/website-section.service'
export type {
  HomeSectionContent,
  WebsiteSection,
  WebsiteSectionType,
} from '~/server/domains/website-section/website-section.types'
export {
  createWebsiteSectionSchema,
  homeSectionContentSchema,
  type UpdateHomeSectionInput,
  updateHomeSectionSchema,
} from '~/server/domains/website-section/website-section.validator'
