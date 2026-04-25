## 1. Database & Types

- [x] 1.1 Add `domain` column (String, required) to `EttaSuggestion` Prisma model with valid values: `guests | events | rsvp | vendors | budget | tasks | other`
- [x] 1.2 Add `executedAt` (DateTime?) and `failureReason` (String?) columns to `EttaSuggestion` Prisma model
- [ ] 1.3 Write and run Prisma migration; backfill `domain = 'other'` on all existing `etta_suggestions` rows
- [x] 1.4 Add `@@index([weddingId, domain, status])` to `EttaSuggestion` for efficient domain-page queries
- [x] 1.5 Update `ActionType`, `Domain`, and `SuggestionStatus` type definitions in `src/lib/etta/types.ts` with the full enums
- [x] 1.6 Define typed payload interfaces per actionType (`VendorDraft`, `BudgetItemDraft`, `WhatsAppBlastDraft`, `VendorEmailDraft`, `GuestFollowupDraft`) in `src/lib/etta/types.ts`

## 2. Etta Tools

- [x] 2.1 Update `create_suggestion` tool in `src/lib/etta/tools/suggestions.ts` to require `domain` (from enum) as a parameter
- [x] 2.2 Update `create_suggestion` tool description to enumerate valid `domain` values and valid `actionType` values so Etta selects the correct one
- [x] 2.3 Update `add_vendor`, `upsert_budget_item`, `send_whatsapp_blast`, `draft_vendor_email` tools to set `domain` when they internally create suggestions
- [x] 2.4 Update `get_pending_suggestions` tool to return `domain` and new status fields

## 3. Background Execution Engine

- [x] 3.1 Create `src/lib/etta/execution/run-approved-suggestion.ts` — function that invokes `runEttaAgent` in a background context (actor: `couple-background`) with the approved suggestion as task input; updates status to `actioned` or `failed`
- [x] 3.2 Update `PATCH /api/etta/approve/[suggestionId]/route.ts` to call `runApprovedSuggestion` after marking status `approved`; handle idempotency (skip if already not `pending`)
- [x] 3.3 Add `actioned` and `failed` status handling to the approve endpoint (for retry: reset `failed` → `approved` and re-trigger execution)
- [x] 3.4 Write unit tests for `runApprovedSuggestion`: success path sets `actioned`, failure path sets `failed` with `failureReason`

## 4. tRPC — Suggestion Queries

- [x] 4.1 Add `getPendingByDomain(domain: Domain)` procedure to the etta tRPC router — returns pending suggestions for a specific domain for the current wedding
- [x] 4.2 Add `getPendingCounts()` procedure — returns `Record<Domain, number>` map of pending suggestion counts per domain for the current wedding
- [x] 4.3 Add `getAll(filter?: SuggestionStatus)` procedure — returns all suggestions for the inbox page, optionally filtered by status
- [x] 4.4 Write unit tests for the three new tRPC procedures

## 5. Global Inbox — `/etta/pending`

- [x] 5.1 Create `src/app/(authenticated)/etta/pending/page.tsx` — server component that renders the suggestion inbox
- [x] 5.2 Wire `PendingSuggestionsFeed` component into the page, passing suggestions from `getAll()` tRPC procedure
- [x] 5.3 Add status filter tabs (All / Pending / Actioned / Failed) to `PendingSuggestionsFeed`
- [x] 5.4 Update `SuggestionCard` to show `actioned` and `failed` states; display `failureReason` on failed cards; show "Retry" button on failed cards
- [x] 5.5 Update `SuggestionCard` to show `domain` badge alongside `tier` badge
- [x] 5.6 Add empty state to `PendingSuggestionsFeed` when no suggestions match the active filter

## 6. Inline Ghost Items — Domain Pages

- [x] 6.1 Create `src/components/etta/SuggestionGhostItem.tsx` — a ghost item component that accepts a suggestion and renders an actionable inline card with "Add" and "Skip" buttons; uses dashed border / muted styling
- [x] 6.2 Add inline ghost items to the Vendors page (`/vendors`) — query `getPendingByDomain('vendors')`, group by `payload.category`, render `SuggestionGhostItem` at the bottom of each matching category section
- [x] 6.3 Add inline ghost items to the Guest List page (`/guest-list`) — query `getPendingByDomain('guests')`, render ghost items in the relevant section
- [x] 6.4 Add inline ghost items to the Events page (`/events`) — query `getPendingByDomain('events')`, render ghost items below the existing events list
- [x] 6.5 Ensure approve/dismiss actions on ghost items call the approve endpoint and optimistically remove the ghost item; invalidate `getPendingCounts` query on action

## 7. Nav Badges

- [x] 7.1 Update authenticated layout to fetch `getPendingCounts()` on mount (via tRPC, cached with React Query)
- [x] 7.2 Update `SidebarNavItem` component to accept an optional `badgeCount` prop and render a count badge
- [x] 7.3 Pass per-domain pending counts from the layout to the relevant sidebar nav items (Vendors, Guest List, Events)
- [x] 7.4 Add total pending count badge to the Etta nav entry
- [x] 7.5 Invalidate `getPendingCounts` query after any approve/dismiss action (inline ghost item or inbox)

## 8. System Prompt Update

- [x] 8.1 Update `build-system-prompt.ts` to instruct Etta to always provide a `domain` value when calling `create_suggestion`, with the valid domain enum listed
- [x] 8.2 Update Telegram suffix in the system prompt to confirm `/etta/pending` as the review URL (the page now exists)
