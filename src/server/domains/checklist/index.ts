import { ChecklistSeedingRepository } from '~/server/domains/checklist/checklist-seeding.repository'
import { ChecklistSeedingService } from '~/server/domains/checklist/checklist-seeding.service'
import { db } from '~/server/infrastructure/database'

export const checklistSeedingService = new ChecklistSeedingService(
  new ChecklistSeedingRepository(db)
)

export { ChecklistSeedingRepository } from '~/server/domains/checklist/checklist-seeding.repository'
export type { ChecklistSeedResult } from '~/server/domains/checklist/checklist-seeding.service'
export { ChecklistSeedingService } from '~/server/domains/checklist/checklist-seeding.service'
