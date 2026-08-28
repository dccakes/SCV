/**
 * @jest-environment node
 */

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(() => ({ organizationId: 'org-1', role: 'owner' })),
}))

import { getTimelineTools } from '~/lib/etta/tools/timeline'
import type { EttaContext } from '~/lib/etta/types'
import { logAudit } from '~/lib/etta/utils/audit'
import { milestoneService } from '~/server/domains/milestone'

jest.mock('~/lib/etta/utils/audit', () => ({
  logAudit: jest.fn(),
}))

jest.mock('~/server/domains/milestone', () => ({
  milestoneService: {
    attestMilestone: jest.fn(),
    getEffectiveMilestones: jest.fn(),
  },
}))

const mockLogAudit = logAudit as jest.Mock
const mockMilestoneService = milestoneService as {
  attestMilestone: jest.Mock
  getEffectiveMilestones: jest.Mock
}

const mockCtx: EttaContext = {
  weddingId: 'wedding-123',
  ettaActorId: 'actor-123',
  actor: 'couple',
  authz: { userId: 'user-1', activeOrganization: { organizationId: 'org-1', role: 'owner' } },
  wedding: {
    groomFirstName: 'John',
    groomLastName: 'Doe',
    brideFirstName: 'Jane',
    brideLastName: 'Smith',
  },
  guestCount: 50,
  eventCount: 2,
  vendorCount: 3,
  pendingSuggestionCount: 1,
  recentMemories: [],
}

describe('getTimelineTools', () => {
  beforeEach(() => jest.clearAllMocks())

  const tools = getTimelineTools(mockCtx)

  describe('get_milestones', () => {
    it('returns milestones from the milestone service', async () => {
      mockMilestoneService.getEffectiveMilestones.mockResolvedValue([
        {
          id: 'milestone-1',
          title: 'Venue booked',
          derivedStatus: 'pending',
          effectiveStatus: 'pending',
        },
      ])

      const result = await tools.get_milestones.execute(
        {},
        { toolCallId: 'tc1', messages: [], abortSignal: undefined as never }
      )

      expect(mockMilestoneService.getEffectiveMilestones).toHaveBeenCalledWith(
        mockCtx.authz,
        'wedding-123'
      )
      expect(result.milestones).toEqual([
        expect.objectContaining({ id: 'milestone-1', title: 'Venue booked' }),
      ])
    })
  })

  describe('complete_milestone', () => {
    it('returns success message for the attested milestone', async () => {
      mockMilestoneService.attestMilestone.mockResolvedValue({
        id: 'milestone-1',
        title: 'Book venue',
        derivedStatus: 'pending',
        effectiveStatus: 'done',
      })

      const result = await tools.complete_milestone.execute(
        { milestoneId: 'milestone-1' },
        { toolCallId: 'tc2', messages: [], abortSignal: undefined as never }
      )

      expect(mockMilestoneService.attestMilestone).toHaveBeenCalledWith(
        mockCtx.authz,
        'milestone-1',
        'wedding-123'
      )
      expect(result.message).toBe('Milestone marked as complete: Book venue')
    })

    it('calls logAudit with correct params', async () => {
      mockMilestoneService.attestMilestone.mockResolvedValue({
        id: 'milestone-2',
        title: 'Send invitations',
        derivedStatus: 'pending',
        effectiveStatus: 'done',
      })

      await tools.complete_milestone.execute(
        { milestoneId: 'milestone-2' },
        { toolCallId: 'tc3', messages: [], abortSignal: undefined as never }
      )

      expect(mockLogAudit).toHaveBeenCalledWith({
        weddingId: 'wedding-123',
        actorId: 'actor-123',
        actorType: 'etta',
        action: 'complete_milestone',
        resourceType: 'milestone',
        resourceId: 'milestone-2',
        payload: { milestoneId: 'milestone-2', title: 'Send invitations' },
      })
    })
  })
})
