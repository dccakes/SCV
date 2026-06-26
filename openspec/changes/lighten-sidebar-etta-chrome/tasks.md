## 1. CSS Token Update

- [x] 1.1 In `src/styles/globals.css`, change `--etta-ink` from `0.19 0.022 48` to `0.28 0.025 45` in the `:root` block only; keep the `.dark` value unchanged

## 2. Sidebar Root Background

- [x] 2.1 In `src/components/nav/sidebar-nav.tsx` line 96, replace `bg-sidebar-ink` with `bg-sidebar` on the root sidebar `<div>`
- [x] 2.2 In the same file, replace `border-white/10` header bottom border with `border-border`

## 3. Sidebar Nav Items

- [x] 3.1 In `src/components/nav/sidebar-nav-item.tsx`, replace inactive state `text-muted-foreground` with `text-foreground/60`
- [x] 3.2 Replace inactive hover `hover:bg-white/25 hover:text-primary-foreground` with `hover:bg-primary/8 hover:text-primary`
- [x] 3.3 Replace active state `bg-primary/25 text-primary-foreground` with `bg-primary/10 text-primary`

## 4. Sidebar Nav Content (Section Labels)

- [x] 4.1 In `src/components/nav/sidebar-nav-content.tsx`, replace `text-[0.55rem] text-muted-foreground` on section labels with `text-xs text-muted-foreground` (size only — token is correct on light surface)

## 5. Sidebar User Avatar Footer

- [x] 5.1 In `src/components/nav/sidebar-user-avatar-button.tsx`, replace user name `text-muted-foreground` with `text-foreground/65` and change size from `text-[0.75rem]` to `text-xs`
- [x] 5.2 Replace role label `text-[0.55rem] text-muted-foreground` with `text-xs text-foreground/50`
- [x] 5.3 Replace sign-out button `border-white/25` with `border-border` and `text-muted-foreground` with `text-foreground/55`
- [x] 5.4 Replace sign-out hover `hover:text-sidebar-cream/75` with `hover:text-foreground`

## 6. Wedding Chip Card

- [x] 6.1 In `src/components/nav/wedding-chip-card.tsx`, replace `border-white/15 bg-white/[0.07]` with `border-border bg-secondary`
- [x] 6.2 Replace couple name `text-sidebar-cream` with `text-foreground` (italic preserved)
- [x] 6.3 Replace date/location `text-accent` — keep as-is (golden accent reads well on warm beige)

## 7. Etta Panel Text Opacities

- [x] 7.1 In `src/components/etta/EttaChat.tsx`, change subtitle opacity from `text-sidebar-cream/32` to `text-sidebar-cream/65`
- [x] 7.2 Change thinking block button label from `text-sidebar-cream/40` to `text-sidebar-cream/60`
- [x] 7.3 Change thinking block content from `text-sidebar-cream/30` to `text-sidebar-cream/55`
- [x] 7.4 Change suggestion chip labels from `text-sidebar-cream/45` to `text-sidebar-cream/70`
- [x] 7.5 Change input placeholder from `placeholder:text-sidebar-cream/35` to `placeholder:text-sidebar-cream/50`
- [x] 7.6 Replace hardcoded `text-emerald-400` status color with `text-success`
- [x] 7.7 Replace hardcoded `bg-emerald-400` status dot with `bg-success`
- [x] 7.8 Replace hardcoded `text-red-400` offline status with `text-destructive`
- [x] 7.9 Replace hardcoded `bg-red-400` offline dot with `bg-destructive`

## 8. Hero Countdown Text Opacities

- [x] 8.1 In `src/components/dashboard/planning-overview.tsx` `CountdownHero`, raise all `sidebar-cream/30` and `sidebar-cream/40` text to `/50` and `/60` respectively
- [x] 8.2 Raise `sidebar-cream/15` colon separator to `sidebar-cream/30` (decorative, so a lower floor is acceptable)

## 9. Verification

- [x] 9.1 Run `npm run lint` — expect zero errors
- [ ] 9.2 Run `npm run build` — expect clean build
- [ ] 9.3 Visual QA: open app in light mode, confirm sidebar is warm cream, nav items readable, active state shows rust-on-blush
- [ ] 9.4 Visual QA: open Etta panel, confirm background is warmer dark, all text labels are clearly legible
- [ ] 9.5 Visual QA: toggle dark mode — confirm sidebar and Etta appearance is unchanged from before
