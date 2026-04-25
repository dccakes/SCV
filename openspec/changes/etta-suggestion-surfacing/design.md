## Context

The `EttaSuggestion` table, creation tools, and approval API already exist. Etta creates suggestions during chat sessions, Telegram conversations, or background cron jobs. The problem is visibility: suggestions are stored but never surfaced to users. The `PendingSuggestionsFeed` and `SuggestionCard` components exist but are not mounted anywhere.

The current approval endpoint (`PATCH /api/etta/approve/[id]`) marks status as `approved` or `dismissed` but does nothing further — there is no execution layer.

**Current tech stack:** Next.js 15 App Router, tRPC, Prisma + PostgreSQL, Vercel AI SDK, Tailwind CSS.

## Goals / Non-Goals

**Goals:**
- Surface pending suggestions contextually on the pages they're relevant to (inline ghost items)
- Provide a global `/etta/pending` inbox as a status-tracked catch-all
- Execute approved suggestions by delegating back to Etta in a background context
- Add `domain` and structured `actionType` as first-class fields on `EttaSuggestion`
- Show pending suggestion counts as nav badges

**Non-Goals:**
- In-chat actionable cards (where Etta suggests and user approves within the active chat session) — deferred
- Real-time push notifications (no WebSocket or SSE for suggestion updates)
- Building out the `budget` or `tasks` pages (those domains are future work; suggestions in those domains fall back to `/etta/pending` until the pages exist)
- Changing the guest-facing concierge flow

## Decisions

### Decision 1: Etta as the execution engine (not a handler registry)

**Decision:** When a suggestion is approved, trigger Etta in a background context with the suggestion payload. Etta uses her existing tools to execute the action.

**Alternatives considered:**
- *Handler registry pattern*: Build a `EXECUTION_HANDLERS` map keyed on `actionType`, each calling the service layer directly. This duplicates logic already in Etta's tools, requires maintaining two paths for every actionType, and has no natural way to handle errors with explanations.

**Why Etta-as-executor:** Etta's tools already validate input, call the correct service methods, and return structured errors. Routing back through Etta means adding a new actionType only requires giving Etta a new tool — no execution handler to register. Failure messages come back as natural language from Etta, which can be stored as `failureReason`.

**Background invocation:** A fire-and-forget async call to `runEttaAgent` from the approve endpoint. Actor context: `couple-background` (or reuse `couple-bot`). No chat message created. The agent task is: "Execute approved suggestion [id]: [summary]. Payload: [payload]. Use your tools."

**Status flow:**
```
pending → approved → actioned   (Etta executed successfully)
                   → failed     (Etta attempted but failed, reason stored)
        → dismissed
```

### Decision 2: Explicit `domain` field, not derived from `actionType`

**Decision:** Add a `domain` column (String, required) to `EttaSuggestion`. Etta must provide it when calling `create_suggestion`. The `create_suggestion` tool description enumerates the valid domain values.

**Alternatives considered:**
- *Derive domain from actionType at query time*: Maintain a `ACTION_TO_DOMAIN` map in code. Fragile — breaks when Etta invents new actionType strings via the `other` escape hatch. Requires code changes to add new mappings.

**Why explicit field:** SQL queries on domain pages become `WHERE domain = 'vendors' AND status = 'pending'` — no application-level mapping needed. The schema self-documents which page owns which suggestions.

### Decision 3: Controlled `actionType` enum with `other` escape hatch

**Decision:** Constrain `actionType` to a defined set of values. The `create_suggestion` tool description lists valid values. `other` is always valid and routes to `/etta/pending` only.

```
add_vendor | upsert_budget_item | send_whatsapp_blast | draft_vendor_email |
suggest_venue_visit | guest_followup | other
```

**Why:** Freeform strings break UI rendering (ghost items need to know how to render each type) and execution routing (Etta needs to map actionType to a tool call). The `other` escape hatch ensures nothing is lost while the enum grows. Monitor `other` usage to identify patterns worth promoting to first-class actionTypes.

**Note:** Enforcement is in the tool description and TypeScript type, not a DB-level constraint (to avoid migration friction when adding new values).

### Decision 4: Inline ghost items placement strategy

**Decision:** Ghost items appear at the bottom of the relevant section/list on domain pages, separated from real items by a subtle divider. For lists with categories (e.g. vendors grouped by category), ghost items for a specific category appear within that category section using `payload.category` as the placement key.

**Why bottom of section vs top:** Top placement interrupts established workflows (users scan their existing data first). Bottom placement says "Etta has additions" without disrupting the existing list.

**Optimistic UI:** On approve/dismiss, the ghost item disappears immediately without waiting for background execution to complete. Status can be verified in `/etta/pending`.

### Decision 5: Nav badge query strategy

**Decision:** A single tRPC query (`etta.getPendingCounts`) returns a `Record<Domain, number>` map. Called once on authenticated layout mount, cached with React Query. Each sidebar nav item renders its count from this map. Total count on the Etta nav entry.

**Why single query:** Avoids N parallel queries (one per nav item). The map is cheap to compute: `GROUP BY domain WHERE status = 'pending'`.

## Risks / Trade-offs

- **Background execution latency** — Fire-and-forget means the user sees `approved` immediately but `actioned` may take a few seconds. The `/etta/pending` inbox shows the intermediate state. Mitigation: show a subtle "Etta is working on this…" indicator on approved items.

- **Etta execution failures** — Etta may fail to execute if payload is incomplete or if the target service rejects the data. Mitigation: `failed` status + `failureReason` stored. User can retry or dismiss.

- **`other` actionType growth** — If Etta over-uses `other`, the inbox fills with unroutable suggestions. Mitigation: system prompt instructs Etta to use `other` only when no enum value fits. Monitor frequency of `other` usage to drive enum expansion.

- **Budget and tasks domains have no pages yet** — Suggestions with `domain: budget` or `domain: tasks` will only appear in `/etta/pending`. Mitigation: clearly communicated in spec. Those pages are future work.

- **Stale nav badge counts** — Counts are fetched on layout mount and not live-updated. After approving a ghost item inline on a domain page, the badge may show stale count. Mitigation: invalidate the `getPendingCounts` query after any approve/dismiss action.

## Migration Plan

1. Prisma migration: add `domain String`, `executedAt DateTime?`, `failureReason String?` to `etta_suggestions`. Backfill `domain = 'other'` for all existing rows.
2. Deploy backend changes (approve endpoint, background runner, updated tools).
3. Deploy UI changes (ghost items, `/etta/pending` page, nav badges).
4. No rollback complexity — new columns are additive. Reverting UI leaves backend changes inert.

## Open Questions

- Should `suggest_venue_visit` be a distinct actionType from `add_vendor`? A venue visit suggestion ("look at this venue") is lighter than actually adding it as a vendor. For now, `add_vendor` with `category: venue` covers both; revisit if venue shortlisting becomes a distinct workflow.
- Should failed suggestions automatically re-queue for Etta to retry, or always require manual user intervention? Current design: always manual. Auto-retry risks Etta looping on a permanently-broken payload.
