# Geo-Based Language Detection — Design Spec

**Date:** 2026-06-23  
**Branch:** `dc/geo-language-detection`  
**Scope:** Public/attendee-facing pages only (UI chrome strings, not couple-authored content)

## Problem

All attendee-facing pages are English-only. Guests visiting from Spanish-speaking countries see English regardless of their language.

## Solution

Geography-based language detection using Vercel's `x-vercel-ip-country` request header. Default locale: `en`. Spanish-speaking countries map to `es`. A `lang-override` cookie allows manual override (used by a language toggle component).

## Supported Locales

- `en` — English (default for all non-Spanish-speaking countries)
- `es` — Spanish (MX, ES, AR, CO, CL, PE, VE, EC, BO, PY, UY, GT, SV, HN, NI, CR, PA, CU, DO, PR, GQ)

## Pages in Scope

| Route | Description |
|---|---|
| `/[websiteSubUrl]` | Wedding website |
| `/[websiteSubUrl]/invite` | Save-the-date page |
| `/[websiteSubUrl]/invite/update` | Household details form |
| `/[websiteSubUrl]/rsvp` | RSVP multi-step form |
| `/join/[token]` | Guest self-registration |

## Architecture

### 1. i18n Library: `next-intl`

Used without URL-based routing. No URL structure changes (routes stay as-is). Locale is determined by request headers/cookies, not URL prefix.

### 2. Locale Detection Flow

```
Request arrives → Middleware runs →
  1. Check lang-override cookie → use if present and valid
  2. Read x-vercel-ip-country header → map to 'es' or 'en'
  3. Set X-Locale response header (readable by server components via headers())
  4. Set locale cookie for persistence across pages
```

### 3. File Structure

```
src/
├── i18n/
│   ├── request.ts              ← next-intl getRequestConfig (reads X-Locale header)
│   └── messages/
│       ├── en.json             ← English strings
│       └── es.json             ← Spanish strings
├── lib/
│   └── locale/
│       └── locale-detection.ts ← Pure function: getLocaleFromCountry(code) → 'en'|'es'
├── middleware.ts               ← Extended with locale detection
└── app/
    ├── [websiteSubUrl]/
    │   └── layout.tsx          ← Wraps with NextIntlClientProvider
    ├── join/[token]/
    │   └── page.tsx            ← Uses getTranslations()
    └── api/
        └── locale/
            └── route.ts        ← POST: set lang-override cookie (for toggle)
```

### 4. Translation Key Namespaces

```json
{
  "common": { "continue", "back", "skip", "searching", "saving" },
  "invite": { "saveTheDate", "date", "location", "invitedHousehold", ... },
  "household": { "members", "firstName", "lastName", "mailingAddress", ... },
  "rsvp": { "findInvitation", "confirmName", "accept", "decline", "sendRsvp", ... },
  "join": { "title", "addToList", "linkNotFound", "alreadyRegistered", ... }
}
```

### 5. Server vs Client Components

- **Server components**: `getTranslations('namespace')` from `next-intl/server`
- **Client components** (all RSVP form steps): `useTranslations('namespace')` from `next-intl`
- **Layout**: `NextIntlClientProvider` with locale + messages from `getMessages()`

## Testing Strategy (TDD)

1. **`locale-detection.ts`** — pure function, unit tested first:
   - Returns `'es'` for all 21 Spanish-speaking country codes
   - Returns `'en'` for non-Spanish countries and null
   - Cookie override takes precedence over geo header

2. **Message completeness** — test that `es.json` has every key from `en.json`

3. **Component tests** — not unit tested (translation strings are visual); covered by the completeness test

## Out of Scope (for now)

- Couple-authored content (wedding story, event details) — future work
- Languages beyond English and Spanish
- SEO locale tags / alternate hreflang
