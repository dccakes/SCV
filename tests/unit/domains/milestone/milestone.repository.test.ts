import { MilestoneCategory, VendorCategory, VendorStatus } from '@prisma/client'

import { MilestoneRepository } from '~/server/domains/milestone/milestone.repository'

describe('MilestoneRepository', () => {
  const mockMilestoneFindUnique = jest.fn()
  const mockMilestoneFindMany = jest.fn()
  const mockMilestoneCreate = jest.fn()
  const mockMilestoneUpdate = jest.fn()
  const mockMilestoneDelete = jest.fn()
  const mockMilestoneFindFirst = jest.fn()
  const mockWeddingFindUnique = jest.fn()

  const mockDb = {
    milestone: {
      findUnique: mockMilestoneFindUnique,
      findMany: mockMilestoneFindMany,
      create: mockMilestoneCreate,
      update: mockMilestoneUpdate,
      delete: mockMilestoneDelete,
      findFirst: mockMilestoneFindFirst,
    },
    wedding: {
      findUnique: mockWeddingFindUnique,
    },
  }

  const milestoneRow = {
    id: 'milestone-1',
    weddingId: 'wedding-1',
    key: 'venue_booked',
    title: 'Venue booked',
    category: MilestoneCategory.VENDORS,
    position: 2,
    targetDate: null,
    userOverrideStatus: null,
    attestedAt: null,
    dismissedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  }

  let repository: MilestoneRepository

  beforeEach(() => {
    jest.resetAllMocks()
    repository = new MilestoneRepository(mockDb as never)
  })

  it('creates a milestone', async () => {
    mockMilestoneCreate.mockResolvedValue(milestoneRow)

    const result = await repository.create({
      weddingId: 'wedding-1',
      key: 'venue_booked',
      title: 'Venue booked',
      category: MilestoneCategory.VENDORS,
      position: 2,
    })

    expect(result).toEqual(milestoneRow)
    expect(mockMilestoneCreate).toHaveBeenCalledWith({
      data: {
        weddingId: 'wedding-1',
        key: 'venue_booked',
        title: 'Venue booked',
        category: MilestoneCategory.VENDORS,
        position: 2,
        targetDate: undefined,
      },
    })
  })

  it('updates milestone override fields', async () => {
    const attestedAt = new Date('2026-04-26T10:00:00.000Z')
    mockMilestoneUpdate.mockResolvedValue({
      ...milestoneRow,
      userOverrideStatus: 'attested',
      attestedAt,
    })

    const result = await repository.update('milestone-1', {
      userOverrideStatus: 'attested',
      attestedAt,
      dismissedAt: null,
    })

    expect(result.userOverrideStatus).toBe('attested')
    expect(mockMilestoneUpdate).toHaveBeenCalledWith({
      where: { id: 'milestone-1' },
      data: {
        userOverrideStatus: 'attested',
        attestedAt,
        dismissedAt: null,
      },
    })
  })

  it('deletes a milestone', async () => {
    mockMilestoneDelete.mockResolvedValue(milestoneRow)

    const result = await repository.delete('milestone-1')

    expect(result).toEqual(milestoneRow)
    expect(mockMilestoneDelete).toHaveBeenCalledWith({
      where: { id: 'milestone-1' },
    })
  })

  it('checks wedding ownership by wedding id', async () => {
    mockMilestoneFindFirst.mockResolvedValue({ id: 'milestone-1' })

    const result = await repository.belongsToWedding('milestone-1', 'wedding-1')

    expect(result).toBe(true)
    expect(mockMilestoneFindFirst).toHaveBeenCalledWith({
      where: { id: 'milestone-1', weddingId: 'wedding-1' },
      select: { id: true },
    })
  })

  it('derives effective milestone status from wedding state and overrides', async () => {
    mockWeddingFindUnique.mockResolvedValue({
      id: 'wedding-1',
      milestones: [
        {
          ...milestoneRow,
          id: 'milestone-2',
          key: 'guest_list_drafted',
          title: 'Guest list drafted',
          category: MilestoneCategory.SETUP,
          position: 1,
          userOverrideStatus: 'dismissed',
          dismissedAt: new Date('2026-04-25T00:00:00.000Z'),
        },
        milestoneRow,
        {
          ...milestoneRow,
          id: 'milestone-3',
          key: 'save_the_dates_sent',
          title: 'Save-the-dates sent',
          category: MilestoneCategory.INVITATIONS,
          position: 6,
          userOverrideStatus: 'attested',
          attestedAt: new Date('2026-04-24T00:00:00.000Z'),
        },
      ],
      events: [{ date: new Date('2026-09-12T00:00:00.000Z') }],
      guests: [{ id: 'guest-1' }, { id: 'guest-2' }],
      vendors: [{ category: VendorCategory.VENUE, status: VendorStatus.SELECTED }],
      invitations: [{ rsvp: 'Attending' }],
    })

    const milestones = await repository.findByWeddingIdWithEffectiveStatus('wedding-1')

    expect(mockWeddingFindUnique).toHaveBeenCalledWith({
      where: { id: 'wedding-1' },
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

    expect(milestones).toEqual([
      expect.objectContaining({
        id: 'milestone-2',
        derivedStatus: 'done',
        userOverrideStatus: 'dismissed',
        effectiveStatus: 'pending',
      }),
      expect.objectContaining({
        id: 'milestone-1',
        derivedStatus: 'done',
        userOverrideStatus: null,
        effectiveStatus: 'done',
      }),
      expect.objectContaining({
        id: 'milestone-3',
        derivedStatus: 'pending',
        userOverrideStatus: 'attested',
        effectiveStatus: 'done',
      }),
    ])
  })

  it('returns an empty list when the wedding is not found', async () => {
    mockWeddingFindUnique.mockResolvedValue(null)

    const result = await repository.findByWeddingIdWithEffectiveStatus('missing-wedding')

    expect(result).toEqual([])
  })

  it('does not count side-event Not Invited rows as RSVP responses', async () => {
    mockWeddingFindUnique.mockResolvedValue({
      id: 'wedding-1',
      milestones: [
        {
          ...milestoneRow,
          id: 'milestone-rsvp',
          key: 'rsvps_collected',
          title: 'RSVPs collected',
          category: MilestoneCategory.INVITATIONS,
          position: 8,
        },
      ],
      events: [{ date: new Date('2026-09-12T00:00:00.000Z') }],
      guests: Array.from({ length: 10 }, (_, index) => ({ id: `guest-${index + 1}` })),
      vendors: [],
      invitations: [
        ...Array.from({ length: 8 }, () => ({ rsvp: 'Attending' })),
        ...Array.from({ length: 2 }, () => ({ rsvp: 'Invited' })),
        ...Array.from({ length: 10 }, () => ({ rsvp: 'Not Invited' })),
      ],
    })

    const milestones = await repository.findByWeddingIdWithEffectiveStatus('wedding-1')

    expect(milestones).toEqual([
      expect.objectContaining({
        id: 'milestone-rsvp',
        derivedStatus: 'pending',
        effectiveStatus: 'pending',
      }),
    ])
  })
})
