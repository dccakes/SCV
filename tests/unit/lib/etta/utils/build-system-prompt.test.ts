import { buildSystemPrompt } from '~/lib/etta/utils/build-system-prompt'
import type { EttaContext } from '~/lib/etta/types'

function makeContext(overrides: Partial<EttaContext> = {}): EttaContext {
  return {
    weddingId: 'wedding-1',
    ettaActorId: 'actor-1',
    actor: 'couple',
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
    recentMemories: [],
    ...overrides,
  }
}

// ── Planner prompt (couple) ─────────────────────────────────────────────────

describe('buildSystemPrompt — couple (planner)', () => {
  it('includes couple names', () => {
    const prompt = buildSystemPrompt('couple', makeContext())

    expect(prompt).toContain('Emily')
    expect(prompt).toContain('James')
  })

  it('includes current counts', () => {
    const prompt = buildSystemPrompt('couple', makeContext())

    expect(prompt).toContain('25 guests')
    expect(prompt).toContain('3 events')
    expect(prompt).toContain('5 vendors')
    expect(prompt).toContain('2 pending suggestions')
  })

  it('includes action tier descriptions', () => {
    const prompt = buildSystemPrompt('couple', makeContext())

    expect(prompt).toContain('T0')
    expect(prompt).toContain('T1')
    expect(prompt).toContain('T2')
  })

  it('includes memories when present', () => {
    const ctx = makeContext({
      recentMemories: ['Bride prefers peonies', 'Budget is $30k'],
    })

    const prompt = buildSystemPrompt('couple', ctx)

    expect(prompt).toContain('Bride prefers peonies')
    expect(prompt).toContain('Budget is $30k')
  })
})

// ── Concierge prompt (guest) ────────────────────────────────────────────────

describe('buildSystemPrompt — guest (concierge)', () => {
  it('includes couple names', () => {
    const prompt = buildSystemPrompt('guest', makeContext({ actor: 'guest' }))

    expect(prompt).toContain('Emily')
    expect(prompt).toContain('James')
  })

  it('does NOT include action tiers', () => {
    const prompt = buildSystemPrompt('guest', makeContext({ actor: 'guest' }))

    expect(prompt).not.toContain('T0')
    expect(prompt).not.toContain('T1')
    expect(prompt).not.toContain('T2')
  })

  it('mentions RSVP capability', () => {
    const prompt = buildSystemPrompt('guest', makeContext({ actor: 'guest' }))

    expect(prompt).toContain('RSVP')
  })
})
