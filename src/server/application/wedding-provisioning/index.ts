/**
 * Wedding Provisioning Application Service - Barrel Export
 */

import { provisionEtta } from '~/lib/etta/provision'
import { eventManagementService } from '~/server/application/event-management'
import { WeddingProvisioningService } from '~/server/application/wedding-provisioning/wedding-provisioning.service'
import { checklistSeedingService } from '~/server/domains/checklist'
import { guestTagService } from '~/server/domains/guest-tag'
import { weddingService } from '~/server/domains/wedding'

export const weddingProvisioningService = new WeddingProvisioningService({
  weddingService,
  guestTagService,
  eventManagementService,
  checklistSeedingService,
  provisionEtta,
})

export {
  type WeddingProvisioningDeps,
  WeddingProvisioningService,
} from '~/server/application/wedding-provisioning/wedding-provisioning.service'
