## Why

Etta can proactively create suggestions — from Telegram conversations, background cron jobs, or research tasks — but there is no UI to surface them to users. The backend infrastructure is fully built (`EttaSuggestion` table, tools, approval API) but suggestions are invisible unless the user happens to know about `/etta/pending`, which doesn't exist yet. Couples are missing actionable recommendations Etta has already made.

## What Changes

- **New `/etta/pending` page** — global suggestion inbox showing all suggestions with status: pending, approved, actioned, failed. Includes filter by status and retry on failed items.
- **Inline ghost items on domain pages** — pending suggestions appear contextually within the relevant page (e.g. a suggested vendor appears as a ghost item in the vendor list). Disappear on approve/dismiss.
- **Nav badges** — pending suggestion count shown on sidebar nav items per domain, and on the Etta nav entry as a total count.
- **Structured `domain` enum on `EttaSuggestion`** — replaces implicit routing with an explicit field: `guests | events | rsvp | vendors | budget | tasks | other`. Suggestions with domain `other` appear only in `/etta/pending`.
- **Controlled `actionType` enum** — replaces freeform strings with a defined set Etta must pick from, plus `other` as an escape hatch. New actionTypes can be added as patterns emerge from `other` usage.
- **Background Etta execution on approve** — when a user approves a suggestion, Etta is triggered in the background with the suggestion context and payload. Etta uses her existing tools to execute the action. Status transitions to `actioned` on success or `failed` (with reason) on error.
- **Extended status lifecycle** — adds `actioned` and `failed` states (with `executedAt` and `failureReason` fields) to the existing `pending | approved | dismissed` set.

## Capabilities

### New Capabilities

- `suggestion-inbox`: Global `/etta/pending` page — a status inbox showing all suggestions across domains with filtering (pending / actioned / failed) and retry support for failed items.
- `suggestion-inline-placement`: Domain-aware inline ghost items surfaced on relevant pages (vendors, guests, events, rsvp). Ghost items show only `pending` suggestions and disappear immediately on approve/dismiss.
- `suggestion-execution`: Background Etta execution triggered on approve. Etta receives the approved suggestion as context and uses her tools to carry out the action. Updates suggestion status to `actioned` or `failed`.
- `suggestion-taxonomy`: Structured `domain` and `actionType` enums on `EttaSuggestion`. Defines the routing contract between Etta (creates), the UI (places and renders), and the execution layer (runs on approve).

### Modified Capabilities

<!-- No existing specs to modify — these are all new capabilities -->

## Impact

- **Database**: `EttaSuggestion` table — add `domain` column (enum), constrain `actionType` to enum, add `executedAt` (DateTime?), `failureReason` (String?). New Prisma migration required.
- **Types**: New `ActionType`, `Domain`, `SuggestionStatus` enums in `src/lib/etta/types.ts`
- **Etta tools**: `create_suggestion` tool updated to require `domain` and a structured `actionType` from the enum. Tool descriptions updated so Etta knows when to use each.
- **Approve endpoint** (`PATCH /api/etta/approve/[id]`): Extended to trigger background Etta execution after marking approved, and to handle `actioned`/`failed` status transitions.
- **New background Etta runner**: Invoke `runEttaAgent` in a background context (no chat history) with the approved suggestion as task input.
- **New page**: `src/app/(authenticated)/etta/pending/page.tsx`
- **Modified pages**: `/vendors`, `/guest-list`, `/events` — each queries for domain-matching pending suggestions and renders inline ghost items.
- **Modified nav**: `SidebarNav` — add pending count badges per nav item and total on Etta entry.
- **No impact on**: guest-facing concierge flow, RSVP flow, Telegram bot message handling.
