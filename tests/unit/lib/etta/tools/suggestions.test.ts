/**
 * @jest-environment node
 */

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(() => ({ organizationId: 'org-1', role: 'owner' })),
}))

import { getSuggestionTools } from '~/lib/etta/tools/suggestions'
import type { EttaContext } from '~/lib/etta/types'
import { db } from '~/server/db'

jest.mock('~/server/db', () => ({
  db: {
    ettaSuggestion: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

const mockDb = db as {
  ettaSuggestion: {
    findMany: jest.Mock
    create: jest.Mock
  }
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

const toolOpts = { toolCallId: 'tc1', messages: [], abortSignal: undefined as never }

describe('getSuggestionTools', () => {
  beforeEach(() => jest.clearAllMocks())

  const tools = getSuggestionTools(mockCtx)

  describe('get_pending_suggestions', () => {
    it('returns pending suggestions from DB', async () => {
      const suggestions = [
        {
          id: 'sug-1',
          summary: 'Add vendor',
          tier: 'T1',
          domain: 'vendors',
          actionType: 'add_vendor',
          status: 'pending',
          executedAt: null,
          failureReason: null,
          createdAt: new Date(),
        },
        {
          id: 'sug-2',
          summary: 'Send blast',
          tier: 'T2',
          domain: 'vendors',
          actionType: 'send_whatsapp_blast',
          status: 'failed',
          executedAt: new Date('2026-04-24T12:00:00.000Z'),
          failureReason: 'Twilio unavailable',
          createdAt: new Date(),
        },
      ]
      mockDb.ettaSuggestion.findMany.mockResolvedValue(suggestions)

      const result = await tools.get_pending_suggestions.execute({}, toolOpts)

      expect(mockDb.ettaSuggestion.findMany).toHaveBeenCalledWith({
        where: { weddingId: 'wedding-123', status: 'pending' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          summary: true,
          tier: true,
          domain: true,
          actionType: true,
          status: true,
          executedAt: true,
          failureReason: true,
          createdAt: true,
        },
      })
      expect(result).toEqual(suggestions)
    })
  })

  describe('create_suggestion', () => {
    it('creates with correct tier and status', async () => {
      mockDb.ettaSuggestion.create.mockResolvedValue({ id: 'sug-new' })

      const params = {
        domain: 'vendors' as const,
        actionType: 'add_vendor',
        tier: 'T1' as const,
        summary: 'Add a photographer',
        payload: { name: 'Photo Pro', category: 'PHOTOGRAPHER' },
      }

      const result = await tools.create_suggestion.execute(params, toolOpts)

      expect(mockDb.ettaSuggestion.create).toHaveBeenCalledWith({
        data: {
          weddingId: 'wedding-123',
          actorId: 'actor-123',
          domain: 'vendors',
          actionType: 'add_vendor',
          tier: 'T1',
          summary: 'Add a photographer',
          payload: { name: 'Photo Pro', category: 'PHOTOGRAPHER' },
          status: 'pending',
        },
      })
      expect(result).toEqual({
        suggestionId: 'sug-new',
        status: 'pending',
        message: 'Suggestion created for review',
      })
    })

    it('describes the supported domains and action types', () => {
      expect(tools.create_suggestion.description).toContain(
        'guests, events, rsvp, vendors, budget, tasks, other'
      )
      expect(tools.create_suggestion.description).toContain(
        'add_vendor, upsert_budget_item, send_whatsapp_blast, draft_vendor_email, suggest_venue_visit, guest_followup, other'
      )
    })
  })
})
