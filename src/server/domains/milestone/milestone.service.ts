import { TRPCError } from '@trpc/server'

import type { AuthzContext } from '~/server/authz/authorization.types'
import { requirePermission } from '~/server/authz/permission-checker'
import type { MilestoneRepository } from '~/server/domains/milestone/milestone.repository'
import type {
  Milestone,
  MilestoneWithEffectiveStatus,
} from '~/server/domains/milestone/milestone.types'

export class MilestoneService {
  constructor(private milestoneRepository: MilestoneRepository) {}

  async getEffectiveMilestones(
    ctx: AuthzContext,
    weddingId: string
  ): Promise<MilestoneWithEffectiveStatus[]> {
    requirePermission(ctx, { wedding: ['read'] })
    return this.milestoneRepository.findByWeddingIdWithEffectiveStatus(weddingId)
  }

  async attestMilestone(
    ctx: AuthzContext,
    milestoneId: string,
    weddingId: string
  ): Promise<MilestoneWithEffectiveStatus> {
    requirePermission(ctx, { wedding: ['update'] })
    await this.assertMilestoneOwnership(milestoneId, weddingId)
    const existing = await this.requireMilestone(milestoneId)

    const updated = await this.milestoneRepository.update(milestoneId, {
      userOverrideStatus: 'attested',
      attestedAt: new Date(),
      dismissedAt: null,
    })

    return this.enrichMilestone(updated, existing.weddingId)
  }

  async dismissMilestone(
    ctx: AuthzContext,
    milestoneId: string,
    weddingId: string
  ): Promise<MilestoneWithEffectiveStatus> {
    requirePermission(ctx, { wedding: ['update'] })
    await this.assertMilestoneOwnership(milestoneId, weddingId)
    const existing = await this.requireMilestone(milestoneId)

    const updated = await this.milestoneRepository.update(milestoneId, {
      userOverrideStatus: 'dismissed',
      attestedAt: null,
      dismissedAt: new Date(),
    })

    return this.enrichMilestone(updated, existing.weddingId)
  }

  async clearOverride(
    ctx: AuthzContext,
    milestoneId: string,
    weddingId: string
  ): Promise<MilestoneWithEffectiveStatus> {
    requirePermission(ctx, { wedding: ['update'] })
    await this.assertMilestoneOwnership(milestoneId, weddingId)
    const existing = await this.requireMilestone(milestoneId)

    const updated = await this.milestoneRepository.update(milestoneId, {
      userOverrideStatus: null,
      attestedAt: null,
      dismissedAt: null,
    })

    return this.enrichMilestone(updated, existing.weddingId)
  }

  private async assertMilestoneOwnership(milestoneId: string, weddingId: string): Promise<void> {
    const belongs = await this.milestoneRepository.belongsToWedding(milestoneId, weddingId)
    if (!belongs) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }
  }

  private async requireMilestone(milestoneId: string): Promise<Milestone> {
    const milestone = await this.milestoneRepository.findById(milestoneId)
    if (!milestone) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Milestone not found' })
    }

    return milestone
  }

  private async enrichMilestone(
    milestone: Milestone,
    weddingId: string
  ): Promise<MilestoneWithEffectiveStatus> {
    const milestoneState =
      await this.milestoneRepository.findByWeddingIdWithEffectiveStatus(weddingId)
    const resolved = milestoneState.find((item) => item.id === milestone.id)

    if (resolved) {
      return resolved
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Updated milestone ${milestone.id} missing from wedding snapshot ${weddingId}`,
    })
  }
}
