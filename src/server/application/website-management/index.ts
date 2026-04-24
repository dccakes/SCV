import { WebsiteManagementService } from '~/server/application/website-management/website-management.service'
import { EventRepository } from '~/server/domains/event/event.repository'
import { WebsiteRepository } from '~/server/domains/website/website.repository'
import { WebsitePasswordService } from '~/server/domains/website/website-password.service'
import { WebsiteSectionRepository } from '~/server/domains/website-section/website-section.repository'
import { WeddingRepository } from '~/server/domains/wedding/wedding.repository'
import { db } from '~/server/infrastructure/database'

const websiteRepository = new WebsiteRepository(db)
const weddingRepository = new WeddingRepository(db)
const eventRepository = new EventRepository(db)
const websitePasswordService = new WebsitePasswordService()
const websiteSectionRepository = new WebsiteSectionRepository(db)

export const websiteManagementService = new WebsiteManagementService(
  websiteRepository,
  weddingRepository,
  eventRepository,
  websitePasswordService,
  websiteSectionRepository
)

export { WebsiteManagementService } from '~/server/application/website-management/website-management.service'
