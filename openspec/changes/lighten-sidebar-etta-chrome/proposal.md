## Why

The authenticated app shell renders a near-black sidebar (`sidebar-ink`, L=0.19) on the left and a near-black Etta panel (`etta-ink`, L=0.19) on the right, flanking the warm-cream main content area. In light mode this creates a dark-framed, oppressive layout that contradicts the app's "warm editorial" identity and makes the UI feel like a developer tool rather than a wedding planning platform. The `--sidebar` CSS token (L=0.97, warm beige) already exists in the design system but is unused.

## What Changes

- **Sidebar background**: switches from `bg-sidebar-ink` (near-black) to `bg-sidebar` (warm beige, L=0.97) — the existing unused token
- **Sidebar text tokens**: all `text-muted-foreground` references inside the dark sidebar are replaced with the correct tokens for a light surface (`text-foreground/60`, `text-foreground/50`)
- **Sidebar active nav item**: active state moves from white text on dark-rust to `text-primary` on `bg-primary/10` — warm rust on cream blush
- **Sidebar chrome details**: hairline borders, chip card background, and sign-out button border updated from glass-on-dark (`border-white/10`, `bg-white/[0.07]`) to warm design-system tokens (`border-border`, `bg-secondary`)
- **Etta background**: light-mode `--etta-ink` token lightened from `0.19` to `0.28` lightness — warmer espresso instead of near-black; Etta remains intentionally dark as the singular contrast panel
- **Etta text opacities**: minimum opacity floor raised across all text inside the Etta panel (labels, chips, placeholder, thinking blocks) — currently several are below WCAG AA (e.g., `sidebar-cream/32` ≈ 1.8:1 contrast)
- **Hero countdown text opacities**: secondary text in the dashboard hero card (`sidebar-cream/30`, `/40`) raised to `/50`–`/60` minimum
- **Text size floor**: all `text-[0.55rem]` and `text-[0.56rem]` occurrences in the sidebar replaced with `text-xs` (12px minimum)
- **Hardcoded color removed**: `text-emerald-400` in Etta status indicator replaced with `text-success` token

## Capabilities

### New Capabilities

- `sidebar-light-theme`: Sidebar renders with a warm-beige background in light mode, using design-system tokens throughout (no ink/glass references)
- `etta-accessible-dark`: Etta panel uses a warmer dark background with text contrast meeting WCAG AA minimums

### Modified Capabilities

<!-- No existing spec-level behavior changes — this is a visual/token-only change -->

## Impact

- **Files changed**: `src/styles/globals.css`, `src/components/nav/sidebar-nav.tsx`, `src/components/nav/sidebar-nav-item.tsx`, `src/components/nav/sidebar-nav-content.tsx`, `src/components/nav/sidebar-user-avatar-button.tsx`, `src/components/nav/wedding-chip-card.tsx`, `src/components/etta/EttaChat.tsx`, `src/components/dashboard/planning-overview.tsx`
- **No API changes**: purely visual — tokens, Tailwind classes, one CSS variable value
- **Dark mode**: unaffected; dark mode already uses the correct dark sidebar tokens and Etta keeps its current dark appearance, so the light-mode fix does not regress it
- **No new dependencies**
