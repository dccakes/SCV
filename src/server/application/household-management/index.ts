/**
 * Household Management Application Service - Barrel Export
 *
 * Exports all household management application service components.
 */

import { HouseholdManagementService } from '~/server/application/household-management/household-management.service'
import { EventRepository } from '~/server/domains/event/event.repository'
import { GiftRepository } from '~/server/domains/gift/gift.repository'
import { GuestRepository } from '~/server/domains/guest/guest.repository'
import { HouseholdRepository } from '~/server/domains/household/household.repository'
import { InvitationRepository } from '~/server/domains/invitation/invitation.repository'
import { WebsiteRepository } from '~/server/domains/website/website.repository'
import { db } from '~/server/infrastructure/database'
import { createUnitOfWork } from '~/server/infrastructure/database/unit-of-work'

// Create repository instances
const householdRepo = new HouseholdRepository(db)
const guestRepo = new GuestRepository(db)
const invitationRepo = new InvitationRepository(db)
const giftRepo = new GiftRepository(db)
const websiteRepo = new WebsiteRepository(db)

// Create singleton instance with injected repositories
export const householdManagementService = new HouseholdManagementService(
  householdRepo,
  guestRepo,
  invitationRepo,
  giftRepo,
  websiteRepo,
  createUnitOfWork(db, (tx) => ({
    household: new HouseholdRepository(tx),
    guest: new GuestRepository(tx),
    invitation: new InvitationRepository(tx),
    gift: new GiftRepository(tx),
    event: new EventRepository(tx),
  }))
)

// Export classes for testing/DI
export { HouseholdManagementService } from '~/server/application/household-management/household-management.service'
// Export types
export type {
  CreateHouseholdResult,
  CreateHouseholdWithGuestsInput,
  UpdateHouseholdResult,
  UpdateHouseholdWithGuestsInput,
} from '~/server/application/household-management/household-management.types'
// Export validators
export {
  type CreateHouseholdWithGuestsSchemaInput,
  createHouseholdWithGuestsSchema,
  type DeleteHouseholdSchemaInput,
  deleteHouseholdSchema,
  type GiftInputSchemaInput,
  type GuestPartyInputSchemaInput,
  giftInputSchema,
  guestPartyInputSchema,
  type UpdateHouseholdWithGuestsSchemaInput,
  updateHouseholdWithGuestsSchema,
} from '~/server/application/household-management/household-management.validator'
