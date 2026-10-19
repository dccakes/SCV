/**
 * Wedding Provisioning Application Service
 *
 * Onboarding orchestration across domains: create the wedding, then seed its
 * default tags, optional Ceremony event, planning checklist and Etta agent.
 * Only the wedding creation is required to succeed; checklist seeding and
 * Etta provisioning failures are logged and the wedding is kept.
 */

import { logger } from '~/lib/observability/logger'
import type { EventManagementService } from '~/server/application/event-management/event-management.service'
import type { ChecklistSeedingService } from '~/server/domains/checklist/checklist-seeding.service'
import type { GuestTagService } from '~/server/domains/guest-tag/guest-tag.service'
import type { WeddingService } from '~/server/domains/wedding/wedding.service'
import type { CreateWeddingInput, Wedding } from '~/server/domains/wedding/wedding.types'

/**
 * Default tags created for new weddings
 */
const DEFAULT_TAGS = [
  { name: 'Family', color: '#3b82f6' }, // blue
  { name: 'MutualFriends', color: '#10b981' }, // green
  { name: 'Coworkers', color: '#8b5cf6' }, // purple
  { name: 'Plus One', color: '#f59e0b' }, // amber
]

export type WeddingProvisioningDeps = {
  weddingService: Pick<WeddingService, 'createWedding'>
  guestTagService: Pick<GuestTagService, 'seedInitialTags'>
  eventManagementService: Pick<EventManagementService, 'createEventSystem'>
  checklistSeedingService: Pick<ChecklistSeedingService, 'ensureSeeded'>
  provisionEtta: (weddingId: string) => Promise<unknown>
}

export class WeddingProvisioningService {
  constructor(private deps: WeddingProvisioningDeps) {}

  async provisionWedding(userId: string, data: CreateWeddingInput): Promise<Wedding> {
    const { weddingService, guestTagService, eventManagementService, checklistSeedingService } =
      this.deps

    const wedding = await weddingService.createWedding(userId, data)

    await guestTagService.seedInitialTags(wedding.id, DEFAULT_TAGS)

    // Create default "Ceremony" event if date/location provided
    const { weddingDate, weddingLocation } = data
    if (data.hasWeddingDetails && (weddingDate || weddingLocation)) {
      await eventManagementService.createEventSystem(wedding.id, {
        eventName: 'Ceremony',
        date: weddingDate ?? undefined,
        venue: weddingLocation ?? undefined,
        collectRsvp: false,
        allowTagAlongs: false,
      })

      try {
        await checklistSeedingService.ensureSeeded(wedding.id)
      } catch (error) {
        // Preserve successful wedding creation if checklist seeding fails post-commit.
        logger.error(
          'Checklist seeding failed on wedding create',
          { component: 'checklist', wedding_id: wedding.id },
          error
        )
      }
    }

    // Provision Etta AI agent actor — fire-and-forget (idempotent)
    this.deps
      .provisionEtta(wedding.id)
      .catch((err) =>
        logger.error(
          'Etta background provision failed',
          { component: 'etta', wedding_id: wedding.id },
          err
        )
      )

    return wedding
  }
}
