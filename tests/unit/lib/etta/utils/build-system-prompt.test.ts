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

  it('includes memories when present', () => {
    const ctx = makeContext({
      recentMemories: ['Bride prefers peonies', 'Budget is $30k'],
    })

    const prompt = buildSystemPrompt(ctx)

    expect(prompt).toContain('Bride prefers peonies')
    expect(prompt).toContain('Budget is $30k')
  })

  it('includes PDF failure guidance', () => {
    const prompt = buildSystemPrompt(makeContext())

    expect(prompt).toContain('read_pdf')
    expect(prompt).toContain('status `parse_error`')
    expect(prompt).toContain('status `no_text`')
    expect(prompt).toContain('share the key details manually')
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
