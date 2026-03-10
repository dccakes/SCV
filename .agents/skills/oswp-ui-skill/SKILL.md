---
name: oswp-ui
description: >
  Build UI components, views, pages, and screens for the OSWP (Open Source Wedding Platform) application. Use this skill whenever building, modifying, or extending any part of the OSWP product — including new views (dashboard, guest list, RSVPs, seating, vendors, budget, timeline, invitations, website editor), new components (cards, drawers, modals, forms, filters, tables), Etta AI panel variants, onboarding flows, empty states, or any other in-app UI. Also use when a user asks to make something "look like OSWP", "match the existing design", or "stay consistent with the other screens". The skill ensures visual coherence — correct fonts, colours, spacing, and component patterns — across the entire application.
---

# OSWP UI Skill

This skill encodes the complete visual language and component system for OSWP. Read it fully before writing any code. Then produce output that is visually indistinguishable from the existing screens.

For detailed component specs, refer to the reference files:
- `references/tokens.md` — full CSS variable system (light + dark)
- `references/components.md` — component-level specs (buttons, tags, pills, cards, drawers, tables, filters)
- `references/patterns.md` — layout patterns, Etta panel, navigation, animation, dark mode rules

---

## Core Identity

OSWP is **editorial and warm** — it reads like fine stationery, not enterprise software. Every detail is considered. The palette comes from natural materials: cream paper, dark ink, terracotta clay, sage green, aged gold.

**What to avoid:**
- Purple/blue gradients
- Inter, Roboto, or system fonts as primaries
- Rounded pill buttons (buttons are `border-radius: 2px`; pills/tags use `border-radius: 20px`)
- Pure black (`#000`) or pure white (`#fff`) — always use token values
- Dense information without breathing room

---

## Technology Stack

OSWP uses **Next.js + Tailwind CSS** with OKLCH CSS custom properties (shadcn/ui conventions). Components are React. Tailwind utility classes map to the token system below.

The CSS variable system uses OKLCH format: `L C H` (no `oklch()` wrapper in variable definitions, applied as `oklch(var(--token))`).

---

## Typography — The Three-Font System

Three typefaces. Each has a locked role. Do not substitute.

| CSS Variable | Family | Role |
|---|---|---|
| `--font-sans` | **Montserrat** | Body text, UI labels, paragraphs, descriptions |
| `--font-serif` | **Merriweather** | Data-rich content, notes, editorial body text |
| `--font-mono` | **Ubuntu Mono** | Nav items, tags, badges, buttons, data values, metadata, timestamps |
| `--font-display` | **Instrument Serif** (italic) | Display headings, names, hero text, couple names, Etta's identity |

### Type Usage Rules

- **`--font-display` italic** is the signature gesture. Use for: page hero headings, the wedding couple's names wherever displayed prominently, Etta's panel name, card name fields in the guest list.
- **`--font-mono`** for all UI chrome: navigation labels, button text, tag/pill text, section eyebrow labels, timestamps, data cell values, count badges.
- **`--font-sans`** for readable body: descriptions, form labels, paragraphs, Etta's proactive card body text.
- **`--font-serif`** for editorial moments: Etta chat messages, notes fields, longer descriptive content.
- Italic is identity, not emphasis — don't apply `font-style: italic` to body copy or mono elements.

### Scale Reference

| Context | Font | Approx size | Case |
|---|---|---|---|
| Hero / page display | `--font-display` | `3.5–5.5rem` | Sentence |
| Card / drawer guest name | `--font-display` | `1.05–1.7rem` | Sentence |
| Page title (topbar) | `--font-display` | `1.3rem` | Sentence |
| Body paragraphs | `--font-sans` | `0.9–1.1rem` | Sentence |
| Etta chat messages | `--font-serif` | `0.82–0.88rem` | Sentence |
| Nav items | `--font-mono` | `0.68rem` | UPPERCASE |
| Section eyebrow labels | `--font-mono` | `0.58–0.65rem` | UPPERCASE |
| Tags / pills / badges | `--font-mono` | `0.54–0.62rem` | UPPERCASE |
| Timestamps / meta | `--font-mono` | `0.52–0.58rem` | lowercase |
| Button text | `--font-mono` | `0.62–0.72rem` | UPPERCASE |
| Table data values | `--font-mono` | `0.68–0.72rem` | Sentence |

---

## Colour System

Tokens are in OKLCH `L C H` format. Use the Tailwind semantic names (`bg-background`, `text-foreground`, etc.) in component code, and the raw CSS variables in custom CSS.

See `references/tokens.md` for the complete token map with hex equivalents.

### Quick Reference — Key Semantic Roles

| Role | Token | Light approx | Dark approx |
|---|---|---|---|
| Page background | `--background` | `#F4EEE3` (warm cream) | `#3A2A2E` (dark rose-ink) |
| Primary text | `--foreground` | `#4A3830` (dark ink) | `#EDE8DC` (warm cream) |
| Card surface | `--card` | `#FFFFFF` | `#4A3438` |
| Primary accent | `--primary` | `#C4633A` (terracotta) | same |
| Success / confirmed | `--success` | `#6B7A5E` (sage) | `#4A6E5A` |
| Sidebar background | `--sidebar` | `#F0E8D8` | `#3A2A2E` |
| Sidebar ink (dark) | `--sidebar-ink` | `#2E2620` | `#2E2620` |
| Sidebar cream | `--sidebar-cream` | `#F5EFE4` | `#F5EFE4` |
| Etta background | `--etta-ink` | `#2E2620` | `#2E2620` |
| Border (light) | `--border` | `rgba(26,21,16,0.10)` | — |
| Muted text | `--muted-foreground` | `#8B7355` | — |

### Accent Colours (not in Tailwind tokens — use directly)

These colours are used for specific semantic purposes and must not be repurposed:

| Name | Value | Use |
|---|---|---|
| `--terra` | `#C4633A` | Primary accent · active states · urgent · CTAs. Maps to `--primary`. |
| `--sage` | `#6B7A5E` | Confirmed / success states · veg dietary tags. Maps to `--success`. |
| `--gold` | `#B89A5C` | **Etta-only accent** — proactive card, avatar gradient, wedding chip date |
| `--mid` | `#8B7355` | Secondary text · muted labels · metadata. Maps to `--muted-foreground`. |
| `--ink-soft` | `#2E2620` | Sidebar and Etta panel backgrounds. Maps to `--etta-ink` / `--sidebar-ink`. |

**Gold is reserved for Etta.** Do not use `--gold` outside the Etta panel, the sidebar wedding chip date, and the countdown widget.

---

## Layout Architecture

Every in-app view uses this shell:

```
┌─────────────────────────────────────────────────────┐
│ Sidebar (220px, fixed)  │ Main content (flex: 1)    │
│  - Logo                 │  - Topbar (56px, sticky)  │
│  - Wedding chip         │  - Filter bar (if needed) │
│  - Nav items            │  - Scrollable content     │
│  - User card            │                           │
│                         │             │ Etta panel  │
│                         │             │ (272–300px) │
└─────────────────────────────────────────────────────┘
```

- `html, body`: `height: 100%; overflow: hidden`
- `.app`: `display: flex; height: 100vh; overflow: hidden`
- Sidebar: `width: 220px; flex-shrink: 0; background: var(--etta-ink)`
- Main: `flex: 1; display: flex; flex-direction: column; overflow: hidden`
- Content area: `flex: 1; display: flex; overflow: hidden`
- Etta panel: `width: 272–300px; flex-shrink: 0; background: var(--etta-ink)`

The grain texture overlay is required on all full-page views — see `references/patterns.md`.

---

## Critical Rules Summary

1. **Never hardcode colours** — always use CSS tokens or the named accent values above
2. **Terracotta = action** — hover states, primary buttons, active nav, urgent indicators
3. **Sage = success** — confirmed RSVP, done tasks, positive feedback
4. **Gold = Etta only** — never repurpose for general UI
5. **Border-radius: 2px for buttons**, 20px for tags/pills, 8px for cards, 4px for inputs
6. **All scrollbars** use the custom thin style (4–5px, transparent track)
7. **Entrance animations** stagger at 40ms intervals per card/row
8. **Topbar** is frosted glass (`backdrop-filter: blur(8px)`, semi-transparent background)
9. **Section labels** use the hairline-rule pattern (`::after` flex rule) — see `references/components.md`
10. **Dark panels** (sidebar, Etta) use `--ink-soft` background with opacity-layered text

Read `references/components.md` before building any interactive component. Read `references/patterns.md` for Etta, navigation, and dark mode guidance.
