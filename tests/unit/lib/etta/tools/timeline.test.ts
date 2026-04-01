/**
 * @jest-environment node
 */

import { logAudit } from '~/lib/etta/utils/audit'
import { getTimelineTools } from '~/lib/etta/tools/timeline'
import type { EttaContext } from '~/lib/etta/types'

jest.mock('~/lib/etta/utils/audit', () => ({
  logAudit: jest.fn(),
}))

const mockLogAudit = logAudit as jest.Mock

const mockCtx: EttaContext = {
  weddingId: 'wedding-123',
  ettaActorId: 'actor-123',
  actor: 'couple',
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
    it('returns default milestones', async () => {
      const result = await tools.get_milestones.execute(
        {},
        { toolCallId: 'tc1', messages: [], abortSignal: undefined as never }
      )

      expect(result.milestones).toBeInstanceOf(Array)
      expect(result.milestones.length).toBeGreaterThan(0)
      expect(result.milestones[0]).toEqual(
        expect.objectContaining({ title: expect.any(String), status: 'pending' })
      )
    })
  })

  describe('complete_milestone', () => {
    it('returns success message with title', async () => {
      const result = await tools.complete_milestone.execute(
        { title: 'Book venue' },
        { toolCallId: 'tc2', messages: [], abortSignal: undefined as never }
      )

      expect(result).toEqual({
        message: 'Milestone marked as complete: Book venue',
      })
    })

    it('calls logAudit with correct params', async () => {
      await tools.complete_milestone.execute(
        { title: 'Send invitations' },
        { toolCallId: 'tc3', messages: [], abortSignal: undefined as never }
      )

      expect(mockLogAudit).toHaveBeenCalledWith({
        weddingId: 'wedding-123',
        actorId: 'actor-123',
        actorType: 'etta',
        action: 'complete_milestone',
        resourceType: 'milestone',
        payload: { title: 'Send invitations' },
      })
    })
  })
})
