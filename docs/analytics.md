# Analytics (PostHog)

This project captures product analytics through [PostHog](https://posthog.com).
Instrumentation is **backend-first**: because the app is built on a robust tRPC
API, the majority of meaningful events are captured automatically on the server,
with a small set of complementary front-end events on the public templates.

Analytics is **optional**. When no PostHog key is configured every capture is a
no-op, so the app runs identically with or without it.

## Configuration

| Variable | Side | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_POSTHOG_KEY` | client | Public project key (`phc_…`). Enables the browser SDK. |
| `NEXT_PUBLIC_POSTHOG_HOST` | client | API host (default `https://us.i.posthog.com`). |
| `POSTHOG_KEY` | server | Optional dedicated server key. Falls back to the public key (same project). |
| `POSTHOG_HOST` | server | Optional server API host. |

See `.env.example` for the full block.

## Event naming

Every event uses a standardized, dot-delimited, snake_case name:

```
{scope}.{object?}.{action}
```

- **scope** — the product area (e.g. `guest_list`, `vendor`, `rsvp`).
- **object** — the thing acted upon (e.g. `household`, `quote_file`). Optional.
- **action** — a canonical verb (see below).

Examples: `guest_list.household.added`, `vendor.quote_file.uploaded`,
`rsvp.public_submission.submitted`, `website.template.updated`.

The vocabulary is defined once in [`src/lib/analytics/events.ts`](../src/lib/analytics/events.ts)
and shared by the client and server so names never drift.

### Scopes

`account`, `wedding`, `website`, `event`, `guest_list`, `rsvp`, `vendor`,
`checklist`, `milestone`, `gift`, `messaging`, `self_fill`, `dashboard`,
`template`.

### Action verbs

`added`, `created`, `updated`, `saved`, `removed`, `deleted`, `viewed`,
`clicked`, `submitted`, `started`, `uploaded`, `imported`, `verified`,
`completed`, `attested`, `dismissed`, `cleared`, `toggled`, `registered`,
`generated`, `revoked`, `sent`, `rated`, and `triggered` (generic fallback).

## Backend instrumentation

A tRPC middleware (`src/server/api/trpc.ts`) wraps the base procedure, so **every
successful mutation across every router** emits an event automatically:

- The event name comes from `TRPC_EVENT_MAP` (an explicit path → name map) with a
  verb-heuristic fallback (`deriveEventName`) for anything unmapped.
- Identifying context is attached on every event:
  - `wedding_id` — always, when resolvable (from the auth scope, the input, or the
    mutation result for public flows that resolve it late).
  - `guest_token` — invite / access / self-fill token, when present.
  - `household_id` — when known.
  - `website_sub_url` — public site slug, when present.
  - `is_authenticated`, `source: "backend"`.
- The sanitized request `payload` is attached as a **temporary backup of what was
  sent** while the app is being tested. Large fields are redacted and the total
  size is capped. (This can be removed later once testing is complete.)
- Anonymous guests do **not** create person profiles
  (`$process_person_profile: false`).

Capture is best-effort and never throws — analytics can never break a request.

The one guest-facing flow that does not go through tRPC (the household invite
"update your details" **server action**) is instrumented directly in
`household-invite.service.ts` (`guest_list.household_details.updated`).

## Front-end instrumentation

`src/lib/analytics/posthog-client.tsx` mounts once in the root layout (covering
both the authenticated product and the public wedding templates). It:

- initializes `posthog-js` only when a key is present,
- captures `$pageview` on every App Router navigation,
- disables DOM autocapture in favor of the explicit, standardized events, and
- injects no visible DOM, so it never affects layout or centering.

Use the `track()` helper from `src/lib/analytics/track.ts` for explicit
template/product events. It mirrors the backend property keys and is a no-op when
PostHog is disabled. Public templates already emit `rsvp.public_submission.started`
on RSVP submission (with wedding id, token, household, and the response payload).
