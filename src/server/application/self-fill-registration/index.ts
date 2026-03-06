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

// Create repository instances
const selfFillRepo = new SelfFillRepository(db)
const householdRepo = new HouseholdRepository(db)
const guestRepo = new GuestRepository(db)

export const selfFillRegistrationService = new SelfFillRegistrationService(
  db,
  selfFillRepo,
  householdRepo,
  guestRepo
)

export { SelfFillRegistrationService } from '~/server/application/self-fill-registration/self-fill-registration.service'
