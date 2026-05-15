import { ChecklistSeedingService } from '~/server/domains/checklist/checklist-seeding.service'
import { db } from '~/server/infrastructure/database'

export const checklistSeedingService = new ChecklistSeedingService(db)

export type { ChecklistSeedResult } from '~/server/domains/checklist/checklist-seeding.service'
export { ChecklistSeedingService } from '~/server/domains/checklist/checklist-seeding.service'
