import { MilestoneRepository } from '~/server/domains/milestone/milestone.repository'
import { MilestoneService } from '~/server/domains/milestone/milestone.service'
import { db } from '~/server/infrastructure/database'

const milestoneRepository = new MilestoneRepository(db)
export const milestoneService = new MilestoneService(milestoneRepository)

export { MilestoneRepository } from '~/server/domains/milestone/milestone.repository'
export { MilestoneService } from '~/server/domains/milestone/milestone.service'
export type {
  Milestone,
  MilestoneCreateData,
  MilestoneDerivationSnapshot,
  MilestoneEffectiveStatus,
  MilestoneOverride,
  MilestoneUpdateData,
  MilestoneWithEffectiveStatus,
} from '~/server/domains/milestone/milestone.types'
export {
  type GetMilestoneInput,
  type GetMilestonesInput,
  getMilestoneSchema,
  getMilestonesSchema,
  type MilestoneIdInput,
  type MilestoneOverrideInput,
  milestoneIdSchema,
  milestoneOverrideSchema,
} from '~/server/domains/milestone/milestone.validator'
