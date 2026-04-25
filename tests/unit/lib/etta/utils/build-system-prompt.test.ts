import type { EttaContext } from '~/lib/etta/types'
import { buildSystemPrompt } from '~/lib/etta/utils/build-system-prompt'

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
    const prompt = buildSystemPrompt(makeContext())

    expect(prompt).toContain('Emily')
    expect(prompt).toContain('James')
  })

  it('includes current counts', () => {
    const prompt = buildSystemPrompt(makeContext())

    expect(prompt).toContain('25 guests')
    expect(prompt).toContain('3 events')
    expect(prompt).toContain('5 vendors')
    expect(prompt).toContain('2 pending suggestions')
  })

  it('includes action tier descriptions', () => {
    const prompt = buildSystemPrompt(makeContext())

    expect(prompt).toContain('T0')
    expect(prompt).toContain('T1')
    expect(prompt).toContain('T2')
  })

  it('instructs Etta to include a domain when creating suggestions', () => {
    const prompt = buildSystemPrompt(makeContext())

    expect(prompt).toContain('always provide a domain value')
    expect(prompt).toContain('guests | events | rsvp | vendors | budget | tasks | other')
  })

  it('includes memories when present', () => {
    const ctx = makeContext({
      recentMemories: ['Bride prefers peonies', 'Budget is $30k'],
    })

    const prompt = buildSystemPrompt(ctx)

    expect(prompt).toContain('Bride prefers peonies')
    expect(prompt).toContain('Budget is $30k')
  })
})

// ── Concierge prompt (guest) ────────────────────────────────────────────────

describe('buildSystemPrompt — guest (concierge)', () => {
  it('includes couple names', () => {
    const prompt = buildSystemPrompt(makeContext({ actor: 'guest' }))

    expect(prompt).toContain('Emily')
    expect(prompt).toContain('James')
  })

  it('does NOT include action tiers', () => {
    const prompt = buildSystemPrompt(makeContext({ actor: 'guest' }))

    expect(prompt).not.toContain('T0')
    expect(prompt).not.toContain('T1')
    expect(prompt).not.toContain('T2')
  })

  it('mentions RSVP capability', () => {
    const prompt = buildSystemPrompt(makeContext({ actor: 'guest' }))

    expect(prompt).toContain('RSVP')
  })
})

// ── Telegram planner prompt (couple-bot) ────────────────────────────────────

describe('buildSystemPrompt — couple-bot (Telegram planner)', () => {
  it('includes the standard planner content (counts, tiers)', () => {
    const prompt = buildSystemPrompt(makeContext({ actor: 'couple-bot' }))

    expect(prompt).toContain('25 guests')
    expect(prompt).toContain('T0')
    expect(prompt).toContain('T1')
  })

  it('appends the Telegram-specific guidance', () => {
    const prompt = buildSystemPrompt(makeContext({ actor: 'couple-bot' }))

    expect(prompt).toContain('Telegram')
    expect(prompt).toContain('/etta/pending')
    expect(prompt).toContain('review inbox')
  })
})

// ── Summariser mode (memory-only) ───────────────────────────────────────────

describe('buildSystemPrompt — toolsetMode: memory-only', () => {
  it('returns the summariser prompt for the couple actor', () => {
    const prompt = buildSystemPrompt(makeContext({ actor: 'couple' }), {
      toolsetMode: 'memory-only',
    })

    expect(prompt).toContain('memory_write')
    expect(prompt).toContain('durable facts')
    expect(prompt).not.toContain('T0')
  })

  it('takes precedence over the couple-bot actor prompt', () => {
    const prompt = buildSystemPrompt(makeContext({ actor: 'couple-bot' }), {
      toolsetMode: 'memory-only',
    })

    expect(prompt).toContain('memory_write')
    // Telegram-specific content must NOT leak into the summariser prompt.
    expect(prompt).not.toContain('Telegram')
    expect(prompt).not.toContain('/etta/pending')
  })

  it('ignores the mode when full is explicitly passed', () => {
    const prompt = buildSystemPrompt(makeContext({ actor: 'couple' }), {
      toolsetMode: 'full',
    })

    expect(prompt).toContain('T0')
    expect(prompt).not.toContain('memory_write')
  })
})

describe('buildSystemPrompt — toolsetMode: background-execution', () => {
  it('adds explicit background execution constraints', () => {
    const prompt = buildSystemPrompt(makeContext({ actor: 'couple-background' }), {
      toolsetMode: 'background-execution',
    })

    expect(prompt).toContain('already-approved suggestion')
    expect(prompt).toContain('Carry out only the approved action')
    expect(prompt).toContain('Do not browse the web')
  })
})
