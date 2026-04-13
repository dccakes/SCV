# DESIGN.md — OSWP Design System

> This document is the authoritative design reference for OSWP (Open Source Wedding Planning). It defines visual language, interaction principles, component usage, and UX decisions. Every new feature must map back here.

---

## 1. Design Philosophy

OSWP is built for couples planning one of the most personal events of their lives. The design must feel **warm without being saccharine**, **calm without being cold**, and **efficient without being clinical**.

Three words describe the intended feeling: **joyful clarity**.

- **Joyful**: Design elements carry the warmth of a special occasion. Colours, typography, and spacing should feel celebratory — but never kitsch.
- **Clarity**: Couples face genuine complexity (guest lists, vendor coordination, timelines). The UI reduces cognitive load at every step. No unnecessary chrome, no ambiguous states.
- **Calm**: Planning is stressful. The platform should actively counter that stress. Ample whitespace, clear hierarchy, and decisive defaults remove friction rather than add to it.

These three qualities must be checked against every new screen, component, and interaction pattern before shipping.

---

## 2. Brand Voice in UI

OSWP's UI copy should feel like a **thoughtful friend who has done this before** — not a corporate tool, not a generic assistant. This applies to labels, empty states, error messages, and AI-generated text.

| Tone | ✅ Do | ❌ Avoid |
|------|-------|---------|
| Warm | "Your guests are waiting to hear from you" | "No RSVPs submitted" |
| Direct | "Add your first event" | "No events found. Please create an event to continue." |
| Celebratory | "You're 80% of the way there!" | "8 of 10 tasks complete" |
| Honest | "Etta isn't sure about this one — want to review?" | "Error: confidence below threshold" |

---

## 3. Colour System

### 3.1 Token Architecture

All colours are defined as OKLCH CSS custom properties. Tailwind consumes them via `oklch(var(--token) / <alpha-value>)`. Never use hardcoded hex or rgb values in components — always reference a semantic token.

### 3.2 Semantic Tokens

#### Light Mode

| Token | OKLCH Value | Intended Use |
|-------|-------------|--------------|
| `--background` | `0.9538 0.016 82.79` | Page background — warm off-white with a subtle golden hue |
| `--foreground` | `0.3353 0.0132 2.7676` | Body text — deep warm brown, not pure black |
| `--primary` | `0.7357 0.1641 34.7091` | Primary actions, key CTAs — a warm terracotta/amber |
| `--primary-foreground` | `1 0 0` | Text on primary backgrounds |
| `--secondary` | `0.9596 0.02 28.9029` | Secondary surfaces, subtle backgrounds |
| `--secondary-foreground` | `0.5587 0.1294 32.7364` | Text on secondary surfaces |
| `--muted` | `0.9656 0.0176 39.4009` | Disabled states, placeholders, de-emphasised content |
| `--muted-foreground` | `0.5534 0.0116 58.0708` | De-emphasised text |
| `--accent` | `0.6997 0.0882 84.38` | Highlights, hover states — warm olive/gold |
| `--accent-foreground` | `0.3353 0.0132 2.7676` | Text on accent backgrounds |
| `--destructive` | *(danger red)* | Destructive actions — delete, remove |
| `--success` | `0.768 0.161 151.95` | Confirmations, completion states |
| `--border` | *(warm neutral)* | Dividers, input borders |
| `--ring` | *(primary-adjacent)* | Focus rings |

#### Dark Mode

Dark mode mirrors the token names but shifts to deeper, desaturated values. Background uses deep warm charcoal rather than pure black to maintain the warm character.

### 3.3 Usage Rules

1. **Primary colour = decisions and progress.** CTAs, active states, step indicators.
2. **Accent colour = delight and context.** Hover states, selection highlights, celebratory moments.
3. **Muted = information hierarchy.** Secondary labels, helper text, metadata.
4. **Destructive = last resort.** Always paired with a confirmation step. Never used for warnings — use `--accent` or a dedicated warning token.
5. **Success = completion.** RSVP confirmed, vendor saved, website published. One clear moment per flow.

---

## 4. Typography

### 4.1 Font Stack

OSWP uses system fonts for body text to ensure fast loading and native feel. A display typeface may be introduced for headings in a future milestone — decisions on this require CEO approval.

```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### 4.2 Scale

| Role | Size | Weight | Use |
|------|------|--------|-----|
| Display | 2.25rem (36px) | 700 | Page titles (rare — wedding name, major section headers) |
| Heading 1 | 1.875rem (30px) | 600 | Section titles |
| Heading 2 | 1.5rem (24px) | 600 | Card headers, panel titles |
| Heading 3 | 1.25rem (20px) | 600 | Sub-section labels |
| Body | 1rem (16px) | 400 | Default prose, form labels |
| Small | 0.875rem (14px) | 400 | Helper text, metadata, badges |
| XSmall | 0.75rem (12px) | 400 | Timestamps, tertiary information only |

### 4.3 Button Typography

Buttons use **uppercase, monospaced-style, letter-spaced** text (`tracking-widest` + `font-mono` or equivalent). This creates a crisp, intentional feel for actions — distinct from body prose.

### 4.4 Line Heights

- Body text: `1.5` (relaxed)
- Headings: `1.25` (tight)
- UI labels: `1` (none — vertically centered via flex)

---

## 5. Spacing & Layout

### 5.1 Base Unit

Spacing uses Tailwind's default 4px base unit. All spacing values should be multiples of 4px.

### 5.2 Layout Widths

| Context | Max Width | Notes |
|---------|-----------|-------|
| Dashboard content | `max-w-4xl` (896px) | Core planning surfaces |
| Settings panels | `max-w-2xl` (672px) | Focused, distraction-free |
| Guest website | `max-w-3xl` (768px) | Readable for guests on mobile |
| Modals/dialogs | `max-w-lg` (512px) | Default; `max-w-2xl` for complex forms |
| Full-bleed | 100% | Hero images, navigation bars |

### 5.3 Mobile-First Design (Non-Negotiable)

Mobile is a **first-class citizen**, not a responsive afterthought. This means:

- **Design mobile first.** Start every new screen at 375px width. Expand to desktop. Never design desktop-first and shrink down.
- **All interactive targets**: minimum 44×44px tap target on mobile (Apple HIG / WCAG 2.5.5)
- **No horizontal scrolling** on any mobile breakpoint — content must reflow, not overflow
- **Bottom navigation on mobile**: primary nav actions must be reachable with one thumb
- **Touch gestures**: swipe-to-dismiss for modals and sheets on mobile; no hover-only interactions
- **Test on real devices**: every new feature must be manually verified on at minimum an iPhone SE (small) and a standard Android (medium) before shipping
- **Guest website is held to an even higher mobile bar**: guests receive a link in a text message or email and open it on their phone — treat mobile as the primary surface for all guest-facing design

| Breakpoint | Width | Behaviour |
|-----------|-------|-----------|
| Base | < 640px | Single column, bottom nav, stacked content |
| `sm:` | ≥ 640px | Slightly wider content, same single-column flow |
| `md:` | ≥ 768px | Two-column layouts, top nav possible |
| `lg:` | ≥ 1024px | Full dashboard layout with sidebar |

### 5.4 Grid Patterns

- **Guest list, vendor list**: Table on desktop (`lg:`), card stack on mobile
- **Dashboard overview**: 2-up or 3-up stat cards on desktop, single column on mobile
- **Settings**: Single column, full width within max-width constraint

---

## 6. Component Conventions

### 6.1 Buttons

Four primary variants. Choose the minimum necessary emphasis for the context.

| Variant | Use | Notes |
|---------|-----|-------|
| `default` | Primary CTA — one per view | Primary colour fill |
| `secondary` | Secondary actions | Outlined, `--secondary` background |
| `destructive` | Delete / remove | Always confirm before executing |
| `ghost` | Toolbar, navigation actions | No background until hover |
| `outline` | Less-prominent actions | Border only |
| `link` | Inline contextual actions | Underline on hover |

**Rules:**
- One `default` button per screen section. Never two equal-weight CTAs competing.
- Destructive buttons must be visually separated from adjacent non-destructive buttons (whitespace or a divider).
- Loading states: replace label with a spinner and disable the button. Never remove the button.

### 6.2 Forms

- **Label placement**: Always above the field, never inside (placeholder is not a label).
- **Placeholder text**: Use for format hints only (`e.g. jane@example.com`). Never for labels.
- **Helper text**: Below the field, `text-muted-foreground`, small size.
- **Error text**: Below the field, `text-destructive`, small size. Inline errors preferred over toast-only errors for form validation.
- **Required fields**: No asterisks in consumer-facing forms. Mark optional fields with `(optional)` instead.
- **Smart defaults**: Per PRINCIPLES.md, AI should pre-populate when context exists. Empty forms are a last resort.

### 6.3 Cards

Cards represent discrete objects (a guest, a vendor, an event). They should:
- Have a single primary action that is obvious on hover/focus
- Never show more than 5 data points in list context — truncate with a "view" action
- Use `CardHeader` / `CardContent` / `CardFooter` structure for complex cards
- On mobile: full width. On desktop: respect the grid.

### 6.4 Modals & Dialogs

- **Use modals for**: Confirmations, quick-entry forms (add a guest, tag a vendor), media previews
- **Do not use modals for**: Complex multi-step flows (use a dedicated page), navigation
- Backdrop closes the modal only for non-destructive actions. Destructive confirmations require an explicit cancel button.
- Default max-width: `max-w-lg`. Complex forms: `max-w-2xl`.

### 6.5 Empty States

Every list, table, collection view, and data surface must have a designed empty state. **"No data" is not a state — it is a missing design.**

Empty states must:
1. Explain what belongs here in one sentence
2. Provide the primary action to fill it (a button, not a link)
3. Use warm, encouraging language (see Brand Voice section)
4. Never show a raw "0 items" count as the only feedback

| Surface | Empty State Copy | CTA |
|---------|-----------------|-----|
| Guest list | "Your guest list is ready for you. Add your first guest to get started." | Add Guest |
| Vendor list | "Track all your vendors in one place. Add your first one." | Add Vendor |
| Events | "Every great wedding has a plan. Add your first event." | Add Event |
| RSVP responses | "No RSVPs yet — your invitation link is ready to share." | Copy Link |
| Etta chat | "Ask Etta anything about your wedding. She's here to help." | *(no CTA — just the chat input)* |

Never: "No guests found." — this reads as a search failure, not an invitation to act.

### 6.6 Loading States

Loading states must be designed as carefully as content states. They are the first thing many users see.

**Rules:**
- Use `skeleton` component for all content that will appear — never a blank space or white flash
- Skeletons must match the **exact dimensions** of the loaded content — no layout shift on load
- Skeleton animation: subtle shimmer (`animate-pulse`), not a spinning indicator
- Inline spinners only for button actions and in-place mutations
- Full-page loading spinner only for initial auth/data hydration — not for navigation between pages
- Loading states must not block navigation — users should be able to move to another section while data loads

**Per-context loading behaviour:**

| Context | Loading Pattern |
|---------|----------------|
| Guest list | Skeleton rows matching the row height |
| Dashboard stats | Skeleton stat cards (same grid layout) |
| Vendor details | Skeleton panel — header + two body rows |
| RSVP form (guest site) | Skeleton fields before form hydrates |
| Cover photo upload | Progress bar inline in the upload zone |
| AI suggestion generating | Animated ellipsis + "Etta is thinking…" label |

### 6.7 Partial States

Partial states are under-designed in most products and must be explicitly handled in OSWP.

A **partial state** is when data exists but is incomplete — a guest with no RSVP, a vendor with no quote attached, an event with no attire set, a website with no cover photo.

**Rules:**
- Partial data must be visually distinct from complete data — use `--muted-foreground` or a placeholder marker, not absence
- Never show a broken UI because a field is missing — show a graceful placeholder
- Where AI can fill the gap (e.g. suggest a vendor quote, draft website copy), surface an Etta suggestion affordance in the partial state
- Partial states must not block the user from completing other tasks — forward progress is always possible

**Examples:**

| Surface | Partial State | Treatment |
|---------|--------------|-----------|
| Guest card | No RSVP yet | "Awaiting RSVP" badge in `--muted` colour |
| Vendor card | No quote attached | "Add quote" affordance in the card footer |
| Website preview | No cover photo | Template-defined gradient placeholder with "Add cover photo" overlay |
| Event | No attire specified | "Attire not set" in muted text + edit link |
| Guest site password gate | Site being built | Friendly holding page, not a 404 |

---

## 7. AI Interaction Patterns

All AI features must satisfy at least one of the five PRINCIPLES.md principles. This section maps those principles to concrete UX patterns.

### 7.1 Principle Mapping

| Principle | UX Pattern |
|-----------|------------|
| AI Generates, Couples Curate | Draft → Review → Accept/Edit flow |
| Smart Defaults Over Empty Forms | Pre-populated fields with edit affordance |
| Proactive Nudges, Not Passive Dashboards | Contextual alert cards with one-tap action |
| Personalization That Compounds | Saved preferences, learned style tokens |
| AI Handles the Tedious, Couples Keep the Joy | Background automation with visible audit log |

### 7.2 Etta (AI Assistant)

Etta is OSWP's primary AI persona. She appears as a chat interface and as inline suggestion cards.

**Etta's visual identity:**
- Distinct from system UI: uses a slightly different card background to signal "this is AI"
- Always shows attribution: suggestions are labelled "Suggested by Etta"
- Never presents AI output as system truth — always as a starting point

**Interaction states:**
1. **Generating**: Animated ellipsis, card in placeholder state
2. **Suggestion ready (T1 — auto-approve)**: Content appears with "Etta suggested this" label and an edit affordance
3. **Suggestion ready (T2 — requires review)**: Content blocked behind "Review Etta's suggestion" CTA. Clear explanation of why this requires human review.
4. **Accepted**: Standard UI with "✓ Etta" attribution mark (subtle, small text)
5. **Edited**: "Edited from Etta's suggestion" attribution (couple owns the content now)
6. **Rejected**: Dismissed cleanly with no friction

**Anti-patterns (per PRINCIPLES.md):**
- Do not present AI output without attribution
- Do not auto-apply T2 suggestions (those require explicit couple approval)
- Do not use generic templates — every Etta output should use couple context
- Do not make Etta opaque — if she's uncertain, she says so

### 7.3 Nudge Cards

Proactive nudges appear as cards in the dashboard and as notifications. They must:
1. State the specific situation ("12 guests haven't RSVPd")
2. State the deadline or urgency ("Your deadline is in 5 days")
3. Offer a one-tap resolution ("Send reminder")
4. Be dismissible — couples can snooze or clear nudges

Nudge cards use a distinct visual treatment: left border accent in `--primary` colour.

---

## 8. Guest Website Design

The guest-facing wedding website (`[websiteSubUrl]`) is a different design context from the planning dashboard. It must feel like a **personal invitation**, not an app.

### 8.1 Guest Site Principles

- **Warmth over function**: Guests don't need toolbars, they need to feel welcomed
- **Mobile-first by default**: Most guests will view on a phone, often in social contexts
- **Password-optional**: When enabled, the gate must feel elegant, not like a security wall
- **RSVP is the primary action**: Every guest-site page should have a clear path to RSVP
- **Theme-coherent throughout**: Every guest-facing surface — website, RSVP forms, confirmation emails, password gate — must reflect the couple's chosen template. No unthemed fallbacks.

### 8.2 Wedding Website Templates

Couples choose a template for their wedding website. The template defines the complete visual identity for all guest-facing surfaces.

**What a template controls:**

| Layer | Examples |
|-------|---------|
| Typography | Font family, weight, size scale for headings and body |
| Colour palette | Background, foreground, accent, button, border colours |
| Layout style | Full-bleed vs centred, card-based vs editorial |
| Imagery treatment | Full-bleed hero, inset photos, circular framing |
| Decorative elements | Borders, dividers, flourishes (optional, can be none) |
| RSVP form skin | Field styles, button colour, confirmation page treatment |

**Template implementation rules:**

1. Templates are CSS variable overrides applied at the `[websiteSubUrl]` route boundary. The dashboard is never affected.
2. Every template must pass WCAG AA contrast at every colour combination it ships. No exceptions.
3. Templates must render correctly on all three core states: loading (skeleton), empty (no cover photo, placeholder name), and fully populated.
4. New templates are added by defining a named theme object — no one-off CSS. New themes go through design review before shipping.
5. The default template must work well without a cover photo — not every couple uploads one immediately.

**Minimum template set (v1):**

| Template Name | Character | Notes |
|--------------|-----------|-------|
| Classic | Clean serif, cream/white, timeless | Default for new weddings |
| Modern | Sans-serif, bold contrast, minimal | Appeals to contemporary couples |
| Garden | Soft greens, botanical feel, light | Nature/outdoor weddings |
| Minimal | Pure white, generous spacing, understated | Photography-forward couples |

Additional templates can be added in future milestones; the template selector UI must accommodate a growing library without requiring redesign.

**Template picker UX (in dashboard):**
- Displayed as visual thumbnails, not a dropdown
- Live preview before committing (do not require a save to preview)
- Confirmation step before applying a new template to a live site

### 8.3 Guest Site Layout

- Max width: `max-w-3xl`, centred
- Typography: template-defined; minimum body text 18px for readability
- Spacing: more generous than dashboard — `py-12` section padding minimum
- Cover photo: Full-bleed hero at top, couple name and date overlaid
- When no cover photo is set: graceful fallback using a template-defined gradient or pattern — never a broken image state

### 8.4 RSVP Form

- Single page, no multi-step wizard for simple RSVPs
- Multi-step only when: multiple events, meal choices, or extended question sets
- RSVP form inherits the couple's template — same font, colours, and styling
- Success state: Celebratory — confirmation copy should feel like a response to an invitation, not a form submission confirmation
- Success page also inherits the template

---

## 9. Navigation

### 9.1 Dashboard Navigation

- **Desktop**: Persistent left sidebar with icon + label
- **Mobile**: Bottom navigation bar (max 5 items) + hamburger for overflow
- Active state: `--primary` background, high contrast label
- Navigation items: Dashboard, Guests, Events, Vendors, Website, Settings

### 9.2 Settings Navigation

- Tabbed navigation within a settings page
- Do not use a separate settings sidebar — keep it lightweight
- Order: Wedding Details, RSVP Settings, Website, Account, Team (future)

---

## 10. Motion & Animation

- **Duration**: 150ms for micro-interactions (hover, focus), 250ms for transitions (modal open, panel slide)
- **Easing**: `ease-out` for elements entering, `ease-in` for elements exiting
- **Respect `prefers-reduced-motion`**: All animations must be disabled or reduced when this system preference is set
- **No decorative animation**: Animation should communicate state change, not add flair. No loading spinners for things that load in < 200ms.

---

## 11. Accessibility

- **Minimum contrast**: WCAG AA (4.5:1 for body text, 3:1 for large text and UI components)
- **Focus rings**: Visible on all interactive elements. Use `--ring` token. Never `outline: none` without a custom replacement.
- **Screen reader labels**: All icon-only buttons must have `aria-label`. All form inputs must have `<label>` (not placeholder as label).
- **Keyboard navigation**: All interactive flows must be completable without a mouse. Test tab order on every new form.
- **Error announcements**: Form errors must be announced via `aria-live` or linked via `aria-describedby`.

---

## 12. Print & Email

### 12.1 Print Styles

Guest list and vendor comparison views support print. Print styles:
- Hide navigation, sidebar, action buttons
- Expand truncated content
- Black text on white background only
- System font (no web fonts)

### 12.2 Email Templates

Email templates (via Resend) follow the same brand tokens where possible. Rules:
- Maximum width: 600px
- Use table-based layout for email client compatibility
- Brand colour (`--primary`) used for CTA buttons and accent rules
- Plain text fallback required for every HTML email

---

## 13. Open Questions & Future Decisions

These are design decisions intentionally deferred pending user research or roadmap prioritisation:

1. **Display typeface**: Each template may define its own heading font. The question is whether OSWP ships a shared web font for the dashboard, or stays system fonts. Pending validation with early adopters.
2. **Template library growth**: How many templates ship in v1 and what is the review/approval process for community-contributed templates? Needs product decision before the template library exceeds ~8 options.
3. **Custom theme editor**: Should power users be able to customise colours/fonts beyond the preset templates (e.g. brand hex codes for couples with strong visual identities)? Scoped out of v1 — revisit at v1.1.
4. **Mobile app patterns**: If a native mobile app is built, do these design tokens translate directly or do we need a separate native design pass? Deferred until web is stable.
5. **Accessibility audit cadence**: At what milestone should we conduct a formal WCAG audit with assistive technology testing? Recommend at first public beta.

---

*Last updated: 2026-04-13 | Maintained by Head of Product*

