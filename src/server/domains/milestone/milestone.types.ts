import type { MilestoneCategory, Milestone as PrismaMilestone } from '@prisma/client'

import type {
  DerivedMilestoneStatus,
  MilestoneDerivationState,
} from '~/server/domains/milestone/milestone.derivation'
import type { CanonicalMilestoneKey } from '~/server/domains/milestone/milestone.seed'

export type Milestone = PrismaMilestone & {
  key: CanonicalMilestoneKey
}

export type MilestoneOverride = 'attested' | 'dismissed' | null
export type MilestoneEffectiveStatus = 'done' | 'pending'

export type MilestoneWithEffectiveStatus = Milestone & {
  derivedStatus: DerivedMilestoneStatus
  effectiveStatus: MilestoneEffectiveStatus
}

export type MilestoneCreateData = {
  weddingId: string
  key: CanonicalMilestoneKey
  title: string
  category: MilestoneCategory
  position: number
  targetDate?: Date
}

export type MilestoneUpdateData = {
  title?: string
  category?: MilestoneCategory
  position?: number
  targetDate?: Date | null
  userOverrideStatus?: MilestoneOverride
  attestedAt?: Date | null
  dismissedAt?: Date | null
}

export type MilestoneDerivationSnapshot = Pick<
  MilestoneDerivationState,
  'primaryEventDate' | 'guestCount' | 'vendors' | 'invitations' | 'now'
>
