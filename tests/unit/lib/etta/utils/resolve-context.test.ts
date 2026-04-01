import { db } from '~/server/db'

jest.mock('~/server/db', () => ({
  db: {
    ettaActor: { findUnique: jest.fn() },
    wedding: { findUnique: jest.fn() },
    guest: { count: jest.fn() },
    event: { count: jest.fn() },
    vendor: { count: jest.fn() },
    ettaSuggestion: { count: jest.fn() },
    ettaMemory: { findMany: jest.fn() },
  },
}))

const mockEttaActor = db.ettaActor.findUnique as jest.Mock
const mockWedding = db.wedding.findUnique as jest.Mock
const mockGuestCount = db.guest.count as jest.Mock
const mockEventCount = db.event.count as jest.Mock
const mockVendorCount = db.vendor.count as jest.Mock
const mockSuggestionCount = db.ettaSuggestion.count as jest.Mock
const mockMemories = db.ettaMemory.findMany as jest.Mock

import { resolveEttaContext } from '~/lib/etta/utils/resolve-context'

// ── Helpers ─────────────────────────────────────────────────────────────────

function setupMocks(overrides: {
  actor?: Record<string, unknown> | null
  wedding?: Record<string, unknown> | null
  guestCount?: number
  eventCount?: number
  vendorCount?: number
  pendingSuggestionCount?: number
  memories?: Array<{ content: string; createdAt: Date }>
} = {}) {
  mockEttaActor.mockResolvedValue(
    overrides.actor !== undefined
      ? overrides.actor
      : { id: 'actor-1', weddingId: 'wedding-1' },
  )
  mockWedding.mockResolvedValue(
    overrides.wedding !== undefined
      ? overrides.wedding
      : {
          id: 'wedding-1',
          groomFirstName: 'James',
          groomLastName: 'Smith',
          brideFirstName: 'Emily',
          brideLastName: 'Jones',
        },
  )
  mockGuestCount.mockResolvedValue(overrides.guestCount ?? 25)
  mockEventCount.mockResolvedValue(overrides.eventCount ?? 3)
  mockVendorCount.mockResolvedValue(overrides.vendorCount ?? 5)
  mockSuggestionCount.mockResolvedValue(overrides.pendingSuggestionCount ?? 2)
  mockMemories.mockResolvedValue(
    overrides.memories ?? [
      { content: 'Bride prefers peonies', createdAt: new Date() },
      { content: 'Budget is $30k', createdAt: new Date() },
    ],
  )
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('resolveEttaContext', () => {
  it('returns full context when wedding and actor exist', async () => {
    setupMocks()

    const ctx = await resolveEttaContext({
      actor: 'couple',
      weddingId: 'wedding-1',
    })

    expect(ctx).toEqual({
      weddingId: 'wedding-1',
      ettaActorId: 'actor-1',
      actor: 'couple',
      guestId: undefined,
      wedding: {
        groomFirstName: 'James',
        groomLastName: 'Smith',
        brideFirstName: 'Emily',
        brideLastName: 'Jones',
      },
      guestCount: 25,
      eventCount: 3,
      vendorCount: 5,
      pendingSuggestionCount: 2,
      recentMemories: ['Bride prefers peonies', 'Budget is $30k'],
    })
  })

  it('throws when etta actor is not provisioned', async () => {
    setupMocks({ actor: null })

    await expect(
      resolveEttaContext({ actor: 'couple', weddingId: 'wedding-1' }),
    ).rejects.toThrow('Etta not provisioned for this wedding')
  })

  it('returns 0 counts when no guests/events/vendors exist', async () => {
    setupMocks({
      guestCount: 0,
      eventCount: 0,
      vendorCount: 0,
      pendingSuggestionCount: 0,
      memories: [],
    })

    const ctx = await resolveEttaContext({
      actor: 'couple',
      weddingId: 'wedding-1',
    })

    expect(ctx.guestCount).toBe(0)
    expect(ctx.eventCount).toBe(0)
    expect(ctx.vendorCount).toBe(0)
    expect(ctx.pendingSuggestionCount).toBe(0)
    expect(ctx.recentMemories).toEqual([])
  })

  it('returns recent memories as string array for planner', async () => {
    setupMocks({
      memories: [
        { content: 'Outdoor ceremony preferred', createdAt: new Date() },
        { content: 'No shellfish allergies', createdAt: new Date() },
        { content: 'Jazz band booked', createdAt: new Date() },
      ],
    })

    const ctx = await resolveEttaContext({
      actor: 'couple',
      weddingId: 'wedding-1',
    })

    expect(ctx.recentMemories).toEqual([
      'Outdoor ceremony preferred',
      'No shellfish allergies',
      'Jazz band booked',
    ])
  })

  it('skips planner-only queries for concierge', async () => {
    setupMocks({})

    const ctx = await resolveEttaContext({
      actor: 'guest',
      weddingId: 'wedding-1',
      guestId: 42,
    })

    expect(ctx.vendorCount).toBe(0)
    expect(ctx.pendingSuggestionCount).toBe(0)
    expect(ctx.recentMemories).toEqual([])
    expect(ctx.guestId).toBe(42)
  })

  it('throws when wedding is not found (null)', async () => {
    setupMocks({ wedding: null })

    await expect(
      resolveEttaContext({ actor: 'couple', weddingId: 'wedding-1' }),
    ).rejects.toThrow('Wedding wedding-1 not found')
  })

  it('passes select { content: true } for memory query in planner mode', async () => {
    setupMocks()

    await resolveEttaContext({ actor: 'couple', weddingId: 'wedding-1' })

    expect(mockMemories).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { content: true },
      }),
    )
  })
})
