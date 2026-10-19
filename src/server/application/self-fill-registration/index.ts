/**
 * Self-Fill Registration Application Service - Barrel Export
 *
 * Orchestrates cross-domain guest self-registration.
 * Token management lives in ~/server/domains/self-fill.
 */

import { SelfFillRegistrationService } from '~/server/application/self-fill-registration/self-fill-registration.service'
import { GuestRepository } from '~/server/domains/guest/guest.repository'
import { HouseholdRepository } from '~/server/domains/household/household.repository'
import { SelfFillRepository } from '~/server/domains/self-fill/self-fill.repository'
import { db } from '~/server/infrastructure/database'
import { createUnitOfWork } from '~/server/infrastructure/database/unit-of-work'

// Household and guest writes are bound to one transaction
const unitOfWork = createUnitOfWork(db, (tx) => ({
  household: new HouseholdRepository(tx),
  guest: new GuestRepository(tx),
}))

export const selfFillRegistrationService = new SelfFillRegistrationService(
  unitOfWork,
  new SelfFillRepository(db)
)

export { SelfFillRegistrationService } from '~/server/application/self-fill-registration/self-fill-registration.service'
