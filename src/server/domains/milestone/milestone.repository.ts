import type { PrismaClient } from '@prisma/client'

import { deriveMilestoneStatus } from '~/server/domains/milestone/milestone.derivation'
import { getEffectiveMilestoneStatus } from '~/server/domains/milestone/milestone.effective-status'
import type {
  Milestone,
  MilestoneCreateData,
  MilestoneUpdateData,
  MilestoneWithEffectiveStatus,
} from '~/server/domains/milestone/milestone.types'

export class MilestoneRepository {
  constructor(private db: PrismaClient) {}

  async findById(id: string): Promise<Milestone | null> {
    return this.db.milestone.findUnique({
      where: { id },
    }) as Promise<Milestone | null>
  }

  async findByWeddingId(weddingId: string): Promise<Milestone[]> {
    return this.db.milestone.findMany({
      where: { weddingId },
      orderBy: [{ category: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
    }) as Promise<Milestone[]>
  }

  async findByWeddingIdWithEffectiveStatus(
    weddingId: string
  ): Promise<MilestoneWithEffectiveStatus[]> {
    const wedding = await this.db.wedding.findUnique({
      where: { id: weddingId },
      select: {
        milestones: {
          orderBy: [{ category: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
        },
        events: {
          orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
          select: { date: true },
        },
        guests: {
          select: { id: true },
        },
        vendors: {
          select: { category: true, status: true },
        },
        invitations: {
          select: { rsvp: true },
        },
      },
    })

    if (!wedding) {
      return []
    }

    const primaryEventDate = wedding.events.find((event) => event.date !== null)?.date ?? null
    const derivationState = {
      primaryEventDate,
      guestCount: wedding.guests.length,
      vendors: wedding.vendors,
      invitations: wedding.invitations,
      now: new Date(),
    }

    return wedding.milestones.map((milestone) => {
      const derivedStatus = deriveMilestoneStatus(
        milestone.key as Milestone['key'],
        derivationState
      )
      return {
        ...(milestone as Milestone),
        derivedStatus,
        effectiveStatus: getEffectiveMilestoneStatus(derivedStatus, milestone.userOverrideStatus),
      }
    })
  }

  async create(data: MilestoneCreateData): Promise<Milestone> {
    return this.db.milestone.create({
      data: {
        weddingId: data.weddingId,
        key: data.key,
        title: data.title,
        category: data.category,
        position: data.position,
        targetDate: data.targetDate,
      },
    }) as Promise<Milestone>
  }

  async update(id: string, data: MilestoneUpdateData): Promise<Milestone> {
    return this.db.milestone.update({
      where: { id },
      data: {
        title: data.title,
        category: data.category,
        position: data.position,
        targetDate: data.targetDate,
        userOverrideStatus: data.userOverrideStatus,
        attestedAt: data.attestedAt,
        dismissedAt: data.dismissedAt,
      },
    }) as Promise<Milestone>
  }

  async delete(id: string): Promise<Milestone> {
    return this.db.milestone.delete({
      where: { id },
    }) as Promise<Milestone>
  }

  async belongsToWedding(id: string, weddingId: string): Promise<boolean> {
    const milestone = await this.db.milestone.findFirst({
      where: { id, weddingId },
      select: { id: true },
    })

    return milestone !== null
  }
}
