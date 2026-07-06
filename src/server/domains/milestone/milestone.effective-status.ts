import type { DerivedMilestoneStatus } from '~/server/domains/milestone/milestone.derivation'
import type {
  Milestone,
  MilestoneWithEffectiveStatus,
} from '~/server/domains/milestone/milestone.types'

export function getEffectiveMilestoneStatus(
  derivedStatus: DerivedMilestoneStatus,
  userOverrideStatus: Milestone['userOverrideStatus']
): MilestoneWithEffectiveStatus['effectiveStatus'] {
  if (userOverrideStatus === 'attested') {
    return 'done'
  }

  if (userOverrideStatus === 'dismissed') {
    return 'pending'
  }

  return derivedStatus
}
