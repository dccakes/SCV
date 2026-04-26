## Context

The app shell has two persistent chrome panels — the left sidebar and the optional right Etta panel — both rendered in `sidebar-ink` / `etta-ink` (`oklch(0.19 0.022 48)`, near-black). In light mode this creates dark flanks around the cream content area, making the app feel heavier than intended. Additionally, text inside both dark surfaces uses tokens calibrated for light backgrounds (`text-muted-foreground`) or extremely low opacity values (`/30`–`/45`) that fail WCAG AA contrast.

The design system already has a `--sidebar` token at `oklch(0.9656 0.0176 39.4009)` (warm beige, L=96%) that is unused. Fixing this is primarily a token-substitution exercise across 8 files, with one CSS variable value change.

## Goals / Non-Goals

**Goals:**
- Sidebar background in light mode uses warm beige (`bg-sidebar`), not near-black
- All text within the sidebar uses tokens appropriate for a light surface
- Etta panel background uses a warmer, less harsh dark (`oklch(0.28 0.025 45)`)
- All text within Etta meets a minimum ~3.5:1 contrast ratio (WCAG AA for UI components)
- No text anywhere in sidebar or Etta is rendered below `text-xs` (12px)
- Dark mode is unaffected
- No layout, spacing, or structural changes

**Non-Goals:**
- Redesigning the Etta panel to be light (it remains intentionally dark as a contrast surface)
- Changing the dashboard hero countdown card (it stays `sidebar-ink` — it's an accent, not chrome)
- Changing any spacing, typography scale, or layout
- Addressing content issues (placeholder data, hardcoded progress %)

## Decisions

### D1: Use `bg-sidebar` token for the sidebar, not a new token

**Decision**: Switch `bg-sidebar-ink` → `bg-sidebar` in `sidebar-nav.tsx`. The `--sidebar` token already exists and resolves to the correct warm beige.

**Alternative considered**: Introduce a new `--sidebar-light` token. Rejected — unnecessary; `--sidebar` is already defined and semantically correct.

### D2: Etta keeps a dark background, but lightened in light mode only

**Decision**: Change `--etta-ink` from `0.19 0.022 48` to `0.28 0.025 45` in light mode only. Leave the `.dark` value unchanged so dark mode preserves the current Etta appearance. Etta is intentionally dark — it creates visual distinction from the content area and feels like a focused AI interface.

**Alternative considered**: Make Etta light (cream sidebar on the right). Rejected — the dark contrast is a deliberate design choice for the AI panel and aligns with the "singular dark accent" principle.

### D3: Raise opacity floors, not introduce new tokens

**Decision**: Increase opacity suffixes on existing `sidebar-cream/*` references rather than adding new named tokens. This is the minimal change that achieves contrast compliance without expanding the token set.

**Floor values**:
- Body/label text: minimum `/65`
- Secondary/supporting text: minimum `/50`
- Placeholder text: minimum `/45` (exempted from WCAG AA per spec, but still improved)

### D4: `text-xs` as the hard minimum font size in chrome

**Decision**: All `text-[0.55rem]` and `text-[0.56rem]` instances in sidebar components → `text-xs` (12px). This is a single-pass find-replace, not a design system change.

## Risks / Trade-offs

- **Sidebar visual identity shift**: The sidebar moving from dark to light is a significant visual change. Couples and planners accustomed to the dark sidebar will notice. However this is the intended correction for light mode — dark mode users are unaffected.
  → Mitigation: No feature flag needed; the existing dark-mode token override already handles `.dark` correctly.

- **Etta text opacities on lighter dark bg**: Raising `etta-ink` lightness from 0.19 → 0.28 slightly reduces contrast of elements that relied on the darker base. Re-verify that raised opacity values still hold on the new background.
  → Mitigation: All proposed opacity values are validated against the new `oklch(0.28 0.025 45)` base before implementation.

## Migration Plan

1. Update the light-mode `--etta-ink` value in `globals.css`
2. Update sidebar component files (nav root → items → content → avatar → chip card) — no user-facing functionality changes
3. Update `EttaChat.tsx` opacity values and replace hardcoded `emerald-400`
4. Update hero countdown text opacities in `planning-overview.tsx`
5. Run `npm run lint` and `npm run build` — no logic changes so no test changes expected
6. Visual QA: check sidebar in light mode, dark mode (should be unchanged), and Etta open/closed states

**Rollback**: Any commit revert restores previous state. No migrations, no data changes.

## Open Questions

- Should `sidebar-cream` tokens be renamed to reflect they are now only used in Etta (not the sidebar)? Deferred — out of scope for this change, would require a broader token audit.
