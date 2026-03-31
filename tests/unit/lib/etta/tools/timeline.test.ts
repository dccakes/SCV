/**
 * @jest-environment node
 */

import { db } from '~/server/db'
import { getTimelineTools } from '~/lib/etta/tools/timeline'
import type { EttaContext } from '~/lib/etta/types'

jest.mock('~/server/db', () => ({
  db: {
    auditLog: {
      create: jest.fn(),
    },
  },
}))

const mockDb = db as {
  auditLog: {
    create: jest.Mock
  }
}

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
      mockDb.auditLog.create.mockResolvedValue({ id: 'log-1' })

      const result = await tools.complete_milestone.execute(
        { title: 'Book venue' },
        { toolCallId: 'tc2', messages: [], abortSignal: undefined as never }
      )

      expect(result).toEqual({
        message: 'Milestone marked as complete: Book venue',
      })
    })

    it('creates an audit log entry', async () => {
      mockDb.auditLog.create.mockResolvedValue({ id: 'log-2' })

      await tools.complete_milestone.execute(
        { title: 'Send invitations' },
        { toolCallId: 'tc3', messages: [], abortSignal: undefined as never }
      )

      expect(mockDb.auditLog.create).toHaveBeenCalledWith({
        data: {
          weddingId: 'wedding-123',
          actorId: 'actor-123',
          actorType: 'etta',
          action: 'complete_milestone',
          resourceType: 'milestone',
          payloadSnapshot: { title: 'Send invitations' },
        },
      })
    })
  })
})
