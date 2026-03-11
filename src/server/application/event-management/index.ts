/**
 * Event Management Application Service - Barrel Export
 */

import { EventManagementService } from '~/server/application/event-management/event-management.service'
import { EventRepository } from '~/server/domains/event/event.repository'
import { db } from '~/server/infrastructure/database'

const eventRepo = new EventRepository(db)

export const eventManagementService = new EventManagementService(eventRepo, db)

export { EventManagementService } from '~/server/application/event-management/event-management.service'
