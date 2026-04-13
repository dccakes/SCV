import { WebsiteManagementService } from '~/server/application/website-management/website-management.service'
import { EventRepository } from '~/server/domains/event/event.repository'
import { WebsiteRepository } from '~/server/domains/website/website.repository'
import { WebsitePasswordService } from '~/server/domains/website/website-password.service'
import { WeddingRepository } from '~/server/domains/wedding/wedding.repository'
import { db } from '~/server/infrastructure/database'

const websiteRepository = new WebsiteRepository(db)
const weddingRepository = new WeddingRepository(db)
const eventRepository = new EventRepository(db)
const websitePasswordService = new WebsitePasswordService()

export const websiteManagementService = new WebsiteManagementService(
  websiteRepository,
  weddingRepository,
  eventRepository,
  websitePasswordService
)

export { WebsiteManagementService } from '~/server/application/website-management/website-management.service'
