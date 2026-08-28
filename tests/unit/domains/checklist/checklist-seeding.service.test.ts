import { MilestoneCategory, TaskCategory } from '@prisma/client'

import { ChecklistSeedingService } from '~/server/domains/checklist/checklist-seeding.service'
import { getCanonicalMilestoneSeed } from '~/server/domains/milestone/milestone.seed'

const createMockDb = () => ({
  wedding: {
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
  milestone: {
    createMany: jest.fn(),
    findMany: jest.fn(),
  },
  task: {
    createMany: jest.fn(),
  },
})

describe('ChecklistSeedingService', () => {
  let mockDb: ReturnType<typeof createMockDb>
  let service: ChecklistSeedingService

  beforeEach(() => {
    mockDb = createMockDb()
    service = new ChecklistSeedingService(mockDb as never)
  })

  it('returns without seeding when the wedding has no events yet', async () => {
    mockDb.wedding.findUnique.mockResolvedValue({
      enabledAddOns: ['tasks'],
      events: [],
    })

    await expect(service.ensureSeeded('wedding-123')).resolves.toEqual({
      eventId: null,
      seededMilestoneCount: 0,
      seededTaskCount: 0,
      enabledAddOnsUpdated: false,
    })

    expect(mockDb.wedding.updateMany).not.toHaveBeenCalled()
    expect(mockDb.milestone.createMany).not.toHaveBeenCalled()
    expect(mockDb.task.createMany).not.toHaveBeenCalled()
  })

  it('seeds canonical milestones and tasks against the first created event', async () => {
    mockDb.wedding.findUnique.mockResolvedValue({
      events: [{ id: 'event-first' }],
    })
    mockDb.wedding.updateMany.mockResolvedValue({ count: 1 })
    mockDb.milestone.createMany.mockResolvedValue({ count: 13 })
    mockDb.milestone.findMany.mockResolvedValue(
      getCanonicalMilestoneSeed().map((milestone, index) => ({
        id: `milestone-${index}`,
        key: milestone.key,
      }))
    )
    mockDb.task.createMany.mockResolvedValue({ count: 58 })

    const result = await service.ensureSeeded('wedding-123')

    expect(result).toEqual({
      eventId: 'event-first',
      seededMilestoneCount: 13,
      seededTaskCount: 58,
      enabledAddOnsUpdated: true,
    })
    expect(mockDb.wedding.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'wedding-123',
        NOT: {
          enabledAddOns: {
            has: 'tasks',
          },
        },
      },
      data: {
        enabledAddOns: {
          push: 'tasks',
        },
      },
    })
    expect(mockDb.milestone.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          weddingId: 'wedding-123',
          key: 'date_set',
          title: 'Date set',
          category: MilestoneCategory.SETUP,
          position: 0,
          targetDate: null,
        }),
      ]),
      skipDuplicates: true,
    })
    expect(mockDb.task.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          weddingId: 'wedding-123',
          eventId: 'event-first',
          seedKey: 'send_formal_invitations',
          title: 'Send formal invitations',
          category: TaskCategory.STATIONERY,
          monthsBeforeWedding: 3,
          milestoneId: 'milestone-7',
          dueDate: null,
          isDefault: true,
          position: 29,
          completed: false,
          completedAt: null,
        }),
        expect.objectContaining({
          weddingId: 'wedding-123',
          eventId: 'event-first',
          seedKey: 'tour_ceremony_venues',
          milestoneId: null,
          isDefault: true,
        }),
      ]),
      skipDuplicates: true,
    })
  })

  it('does not rewrite enabledAddOns when tasks are already enabled', async () => {
    mockDb.wedding.findUnique.mockResolvedValue({
      events: [{ id: 'event-first' }],
    })
    mockDb.wedding.updateMany.mockResolvedValue({ count: 0 })
    mockDb.milestone.createMany.mockResolvedValue({ count: 0 })
    mockDb.milestone.findMany.mockResolvedValue(
      getCanonicalMilestoneSeed().map((milestone, index) => ({
        id: `milestone-${index}`,
        key: milestone.key,
      }))
    )
    mockDb.task.createMany.mockResolvedValue({ count: 0 })

    const result = await service.ensureSeeded('wedding-123')

    expect(result.enabledAddOnsUpdated).toBe(false)
    expect(mockDb.wedding.updateMany).toHaveBeenCalled()
  })

  it('throws when a linked milestone is missing from the canonical map', async () => {
    mockDb.wedding.findUnique.mockResolvedValue({
      events: [{ id: 'event-first' }],
    })
    mockDb.wedding.updateMany.mockResolvedValue({ count: 0 })
    mockDb.milestone.createMany.mockResolvedValue({ count: 13 })
    mockDb.milestone.findMany.mockResolvedValue([
      {
        id: 'milestone-date',
        key: 'date_set',
      },
    ])

    await expect(service.ensureSeeded('wedding-123')).rejects.toThrow(
      'Missing milestone venue_booked while seeding checklist tasks for wedding wedding-123'
    )

    expect(mockDb.task.createMany).not.toHaveBeenCalled()
  })
})
