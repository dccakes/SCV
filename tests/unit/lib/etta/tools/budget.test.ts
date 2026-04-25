/**
 * @jest-environment node
 */

jest.mock('~/server/authz/permission-checker', () => ({
  requirePermission: jest.fn(() => ({ organizationId: 'org-1', role: 'owner' })),
}))

import { getBudgetTools } from '~/lib/etta/tools/budget'
import type { EttaContext } from '~/lib/etta/types'
import { db } from '~/server/db'

jest.mock('~/server/db', () => ({
  db: {
    ettaSuggestion: {
      create: jest.fn(),
      count: jest.fn(),
    },
  },
}))

const mockDb = db as {
  ettaSuggestion: {
    create: jest.Mock
    count: jest.Mock
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

describe('getBudgetTools', () => {
  beforeEach(() => jest.clearAllMocks())

  const tools = getBudgetTools(mockCtx)

  describe('get_budget_summary', () => {
    it('returns pending suggestion count as proxy', async () => {
      mockDb.ettaSuggestion.count.mockResolvedValue(3)

      const result = await tools.get_budget_summary.execute(
        {},
        { toolCallId: 'tc1', messages: [], abortSignal: undefined as never }
      )

      expect(mockDb.ettaSuggestion.count).toHaveBeenCalledWith({
        where: {
          weddingId: 'wedding-123',
          actionType: 'upsert_budget_item',
          status: 'pending',
        },
      })
      expect(result).toEqual({
        message: 'Budget tracking will be available soon. You have 3 pending suggestions.',
      })
    })
  })

  describe('upsert_budget_item', () => {
    it('creates a pending T1 suggestion', async () => {
      mockDb.ettaSuggestion.create.mockResolvedValue({ id: 'sug-1' })

      const params = {
        category: 'Catering',
        description: 'Main dinner service',
        estimated: 5000,
      }

      const result = await tools.upsert_budget_item.execute(params, {
        toolCallId: 'tc2',
        messages: [],
        abortSignal: undefined as never,
      })

      expect(mockDb.ettaSuggestion.create).toHaveBeenCalledWith({
        data: {
          weddingId: 'wedding-123',
          actorId: 'actor-123',
          domain: 'budget',
          actionType: 'upsert_budget_item',
          tier: 'T1',
          payload: params,
          summary: 'Budget update: Catering — Main dinner service ($5000)',
          status: 'pending',
        },
      })
      expect(result).toEqual({
        status: 'pending',
        message: 'Budget update suggestion created',
        suggestionId: 'sug-1',
      })
    })

    it('includes all params in payload including actual cost', async () => {
      mockDb.ettaSuggestion.create.mockResolvedValue({ id: 'sug-2' })

      const params = {
        category: 'Flowers',
        description: 'Centerpieces',
        estimated: 1200,
        actual: 1350,
      }

      await tools.upsert_budget_item.execute(params, {
        toolCallId: 'tc3',
        messages: [],
        abortSignal: undefined as never,
      })

      const call = mockDb.ettaSuggestion.create.mock.calls[0]?.[0]
      expect(call.data.payload).toEqual(params)
    })
  })
})
