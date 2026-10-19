/**
 * Event Management Application Service - Barrel Export
 */

import { EventManagementService } from '~/server/application/event-management/event-management.service'
import { ChecklistSeedingRepository } from '~/server/domains/checklist/checklist-seeding.repository'
import { EventRepository } from '~/server/domains/event/event.repository'
import { GuestRepository } from '~/server/domains/guest/guest.repository'
import { InvitationRepository } from '~/server/domains/invitation/invitation.repository'
import { db } from '~/server/infrastructure/database'
import { createUnitOfWork } from '~/server/infrastructure/database/unit-of-work'

const eventRepo = new EventRepository(db)

const unitOfWork = createUnitOfWork(db, (tx) => ({
  event: new EventRepository(tx),
  guest: new GuestRepository(tx),
  invitation: new InvitationRepository(tx),
  checklist: new ChecklistSeedingRepository(tx),
}))

export const eventManagementService = new EventManagementService(eventRepo, unitOfWork)

export type { EventManagementRepos } from '~/server/application/event-management/event-management.service'
export { EventManagementService } from '~/server/application/event-management/event-management.service'
