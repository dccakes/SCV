import { TRPCError } from '@trpc/server'

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(),
}))

jest.mock('~/server/domains/milestone/milestone.repository')

import { requirePermission } from '~/server/authz/permission-checker'
// @ts-expect-error test mock exports
import {
  MilestoneRepository,
  mockBelongsToWedding,
  mockFindById,
  mockFindByWeddingIdWithEffectiveStatus,
  mockMilestone,
  mockMilestoneWithEffectiveStatus,
  mockUpdate,
  resetMocks,
} from '~/server/domains/milestone/milestone.repository'
import { MilestoneService } from '~/server/domains/milestone/milestone.service'

const mockRequirePermission = requirePermission as jest.Mock
const mockBelongsToWeddingFn = mockBelongsToWedding as jest.Mock
const mockFindByIdFn = mockFindById as jest.Mock
const mockFindByWeddingIdWithEffectiveStatusFn = mockFindByWeddingIdWithEffectiveStatus as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock

describe('MilestoneService', () => {
  const actorContext = {
    userId: 'user-123',
    activeOrganization: {
      organizationId: 'org-123',
      role: 'owner',
    },
  }

  let milestoneService: MilestoneService

  beforeEach(() => {
    resetMocks()
    mockRequirePermission.mockReset()
    mockRequirePermission.mockReturnValue({ organizationId: 'org-123', role: 'owner' })
    mockFindByWeddingIdWithEffectiveStatusFn.mockResolvedValue([])
    milestoneService = new MilestoneService(new MilestoneRepository({}))
  })

  it('gets effective milestones for a wedding with read permission', async () => {
    mockFindByWeddingIdWithEffectiveStatusFn.mockResolvedValue([mockMilestoneWithEffectiveStatus])

    const result = await milestoneService.getEffectiveMilestones(actorContext, 'wedding-123')

    expect(result).toEqual([mockMilestoneWithEffectiveStatus])
    expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { wedding: ['read'] })
    expect(mockFindByWeddingIdWithEffectiveStatusFn).toHaveBeenCalledWith('wedding-123')
  })

  it('attests a milestone within the active wedding scope', async () => {
    mockBelongsToWeddingFn.mockResolvedValue(true)
    mockFindByIdFn.mockResolvedValue(mockMilestone)
    mockUpdateFn.mockResolvedValue({
      ...mockMilestone,
      userOverrideStatus: 'attested',
      attestedAt: new Date('2026-04-26T11:00:00.000Z'),
      dismissedAt: null,
    })
    const refreshedMilestone = {
      ...mockMilestone,
      userOverrideStatus: 'attested',
      attestedAt: new Date('2026-04-26T11:00:00.000Z'),
      dismissedAt: null,
      derivedStatus: 'pending' as const,
      effectiveStatus: 'done' as const,
    }
    mockFindByWeddingIdWithEffectiveStatusFn.mockResolvedValue([refreshedMilestone])

    const result = await milestoneService.attestMilestone(
      actorContext,
      'milestone-123',
      'wedding-123'
    )

    expect(result).toEqual(refreshedMilestone)
    expect(mockRequirePermission).toHaveBeenCalledWith(actorContext, { wedding: ['update'] })
    expect(mockUpdateFn).toHaveBeenCalledWith(
      'milestone-123',
      expect.objectContaining({
        userOverrideStatus: 'attested',
        attestedAt: expect.any(Date),
        dismissedAt: null,
      })
    )
    expect(mockFindByWeddingIdWithEffectiveStatusFn).toHaveBeenCalledWith('wedding-123')
  })

  it('dismisses a milestone within the active wedding scope', async () => {
    mockBelongsToWeddingFn.mockResolvedValue(true)
    mockFindByIdFn.mockResolvedValue(mockMilestone)
    mockUpdateFn.mockResolvedValue({
      ...mockMilestone,
      userOverrideStatus: 'dismissed',
      dismissedAt: new Date('2026-04-26T11:00:00.000Z'),
      attestedAt: null,
    })
    const refreshedMilestone = {
      ...mockMilestone,
      userOverrideStatus: 'dismissed',
      dismissedAt: new Date('2026-04-26T11:00:00.000Z'),
      attestedAt: null,
      derivedStatus: 'done' as const,
      effectiveStatus: 'pending' as const,
    }
    mockFindByWeddingIdWithEffectiveStatusFn.mockResolvedValue([refreshedMilestone])

    const result = await milestoneService.dismissMilestone(
      actorContext,
      'milestone-123',
      'wedding-123'
    )

    expect(result).toEqual(refreshedMilestone)
  })

  it('clears an override and falls back to derived status', async () => {
    mockBelongsToWeddingFn.mockResolvedValue(true)
    mockFindByIdFn.mockResolvedValue({
      ...mockMilestone,
      key: 'save_the_dates_sent',
      userOverrideStatus: 'attested',
      attestedAt: new Date('2026-04-25T00:00:00.000Z'),
    })
    mockUpdateFn.mockResolvedValue({
      ...mockMilestone,
      key: 'save_the_dates_sent',
      userOverrideStatus: null,
      attestedAt: null,
      dismissedAt: null,
    })
    const refreshedMilestone = {
      ...mockMilestone,
      key: 'save_the_dates_sent' as const,
      userOverrideStatus: null,
      attestedAt: null,
      dismissedAt: null,
      derivedStatus: 'pending' as const,
      effectiveStatus: 'pending' as const,
    }
    mockFindByWeddingIdWithEffectiveStatusFn.mockResolvedValue([refreshedMilestone])

    const result = await milestoneService.clearOverride(
      actorContext,
      'milestone-123',
      'wedding-123'
    )

    expect(result).toEqual(refreshedMilestone)
    expect(mockUpdateFn).toHaveBeenCalledWith('milestone-123', {
      userOverrideStatus: null,
      attestedAt: null,
      dismissedAt: null,
    })
  })

  it('fails loudly when the refreshed wedding snapshot does not include the mutated milestone', async () => {
    mockBelongsToWeddingFn.mockResolvedValue(true)
    mockFindByIdFn.mockResolvedValue(mockMilestone)
    mockUpdateFn.mockResolvedValue({
      ...mockMilestone,
      userOverrideStatus: 'attested',
      attestedAt: new Date('2026-04-26T11:00:00.000Z'),
      dismissedAt: null,
    })
    mockFindByWeddingIdWithEffectiveStatusFn.mockResolvedValue([])

    await expect(
      milestoneService.attestMilestone(actorContext, 'milestone-123', 'wedding-123')
    ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' })
  })

  it('rejects mutation when the milestone belongs to a different wedding', async () => {
    mockBelongsToWeddingFn.mockResolvedValue(false)

    await expect(
      milestoneService.dismissMilestone(actorContext, 'milestone-123', 'other-wedding')
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })

    expect(mockUpdateFn).not.toHaveBeenCalled()
  })

  it('throws not found when the scoped milestone disappears before mutation', async () => {
    mockBelongsToWeddingFn.mockResolvedValue(true)
    mockFindByIdFn.mockResolvedValue(null)

    await expect(
      milestoneService.attestMilestone(actorContext, 'milestone-123', 'wedding-123')
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('propagates permission errors for reads', async () => {
    mockRequirePermission.mockImplementation(() => {
      throw new TRPCError({ code: 'FORBIDDEN' })
    })

    await expect(
      milestoneService.getEffectiveMilestones(actorContext, 'wedding-123')
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})
