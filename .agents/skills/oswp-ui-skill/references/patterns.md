# OSWP Layout Patterns & Systems

Navigation, Etta AI panel, layout shell, dark mode, animation, and grain texture.

---

## Grain Texture (Required on all full-page views)

Every full-page view applies a grain overlay using an SVG noise filter as a fixed `::after` on `body`. This adds tactile warmth and prevents the cream background from appearing flat.

```css
body::after {
  content: '';
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9999;
  opacity: 0.6;
}
```

This must be present on every top-level page. Components and modals do not need it separately.

---

## Navigation — Sidebar

**Container:**
```css
width: 220px; flex-shrink: 0;
background: oklch(var(--sidebar-ink));  /* #2E2620 */
display: flex; flex-direction: column;
border-right: 1px solid rgba(255,255,255,0.04);
position: relative; overflow: hidden;
```

**Corner glow (::before):**
```css
content: '';
position: absolute; bottom: -60px; left: -40px;
width: 220px; height: 220px;
background: radial-gradient(circle, rgba(196,99,58,0.15) 0%, transparent 70%);
pointer-events: none;
```

### Logo Strip

```css
padding: 1.2rem 1.4rem 1rem;
border-bottom: 1px solid rgba(255,255,255,0.06);
display: flex; align-items: center; gap: 0.6rem;

.logo-text: font-family: --font-mono; font-size: 0.8rem; font-weight: 500;
            letter-spacing: 0.2em; color: #F5EFE4; text-transform: uppercase;

.logo-dot:  width: 5px; height: 5px; background: #C4633A; border-radius: 50%;
            margin-top: -6px; /* sits top-right of last letter */
```

### Wedding Identity Chip

```css
margin: 1rem 1rem 0.5rem;
background: rgba(255,255,255,0.05);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 6px;
padding: 0.7rem 0.8rem;

.names: font-family: --font-display; font-size: 1rem; font-style: italic;
        color: rgba(245,239,228,0.95); line-height: 1.2; margin-bottom: 0.3rem;

.date:  font-family: --font-mono; font-size: 0.6rem; color: #B89A5C; /* GOLD */
        letter-spacing: 0.1em; text-transform: uppercase;
```

The wedding chip is an identity anchor. The date colour is gold (`#B89A5C`) — this is one of the few places outside Etta where gold appears.

### Section Labels

```css
font-family: --font-mono; font-size: 0.55rem; letter-spacing: 0.18em; UPPERCASE;
color: rgba(245,239,228,0.25);  /* very faint — structural, not primary */
padding: 0.8rem 1.4rem 0.3rem;
```

### Nav Items

```css
display: flex; align-items: center; gap: 0.65rem;
padding: 0.55rem 1.4rem;
font-family: --font-mono; font-size: 0.68rem; letter-spacing: 0.06em; UPPERCASE;
border-left: 2px solid transparent;
transition: all 0.15s;
```

| State | Background | Text | Left border |
|---|---|---|---|
| Default | transparent | `rgba(245,239,228,0.50)` | transparent |
| Hover | `rgba(255,255,255,0.04)` | `rgba(245,239,228,0.85)` | transparent |
| Active | `rgba(196,99,58,0.12)` | `#F5EFE4` | `2px solid #C4633A` |

**Icon column:** `font-size: 0.85rem; width: 16px; text-align: center; flex-shrink: 0;`

### User Card (sidebar bottom)

```css
border-top: 1px solid rgba(255,255,255,0.06);
padding: 1rem;

.user-card: display: flex; align-items: center; gap: 0.7rem;
            padding: 0.5rem 0.4rem; border-radius: 6px; cursor: pointer;
            hover: { background: rgba(255,255,255,0.05); }

.avatar: width: 30px; height: 30px; border-radius: 50%;
         background: linear-gradient(135deg, #C4633A, #B89A5C);
         font-family: --font-display; font-style: italic; font-size: 0.9rem; color: #F5EFE4;

.name:   font-family: --font-sans; font-size: 0.8rem; color: rgba(245,239,228,0.80);
.role:   font-family: --font-mono; font-size: 0.55rem; color: rgba(245,239,228,0.30); UPPERCASE;
```

---

## Navigation — Topbar

```css
height: 56px; flex-shrink: 0;
display: flex; align-items: center; justify-content: space-between;
padding: 0 1.8rem;
border-bottom: 1px solid rgba(26,21,16,0.10);
background: rgba(245,239,228,0.70);  /* semi-transparent — frosted glass effect */
backdrop-filter: blur(8px);
```

Content scrolls behind the topbar — this is intentional.

```css
.page-title:  font-family: --font-display; font-size: 1.3rem; font-weight: 400; color: #1A1510;
.page-sub:    font-family: --font-mono; font-size: 0.62rem; letter-spacing: 0.08em; color: #8B7355;

.topbar-right: display: flex; align-items: center; gap: 0.7rem;
```

---

## Etta AI Panel

Etta is always visible on the right side of every in-app view. She is never hidden behind a toggle.

**Container:**
```css
width: 272–300px; flex-shrink: 0;
background: oklch(var(--etta-ink));  /* #2E2620 */
border-left: 1px solid rgba(26,21,16,0.10);
display: flex; flex-direction: column;
position: relative; overflow: hidden;
```

**Corner glow (::before — gold, top-right):**
```css
content: '';
position: absolute; top: -30px; right: -30px;
width: 160px; height: 160px;
background: radial-gradient(circle, rgba(184,154,92,0.10) 0%, transparent 70%);
pointer-events: none;
```

This distinguishes Etta's glow from the sidebar's (which uses terra/red). Gold glow = Etta's zone.

### Etta Header

```css
padding: 1rem 1.2rem 0.8rem;
border-bottom: 1px solid rgba(255,255,255,0.06);
display: flex; align-items: center; gap: 0.7rem;

.etta-avatar: width: 32px; height: 32px; border-radius: 50%;
              background: linear-gradient(135deg, #B89A5C, #C4633A);
              font-family: --font-display; font-style: italic; font-size: 1.1rem; color: #F5EFE4;
              /* Contains the letter "E" */

.etta-name:     font-family: --font-display; font-size: 1rem; font-style: italic; color: #F5EFE4;
.etta-subtitle: font-family: --font-mono; font-size: 0.55rem; color: rgba(245,239,228,0.30); UPPERCASE;
                /* "OSWP AI Planner" */

/* Online status indicator */
.etta-online: font-family: --font-mono; font-size: 0.55rem; color: #28C840; margin-left: auto;
.etta-online::before: {
  content: ''; display: block; width: 5px; height: 5px;
  background: #28C840; border-radius: 50%;
  animation: blink 2s infinite;
}
@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
```

### Etta Proactive Card

Context-aware insight surfaced at the top of each view. Always present, always relevant to the current view.

```css
margin: 0.8rem 0.9rem 0.4rem;
background: rgba(184,154,92,0.10);         /* gold-tinted */
border: 1px solid rgba(184,154,92,0.20);
border-radius: 6px;
padding: 0.7rem 0.8rem;

.label: font-family: --font-mono; font-size: 0.55rem; letter-spacing: 0.10em; UPPERCASE;
        color: #B89A5C;  /* gold */
        /* prefix with "✦ " — Etta's signature glyph */

.body:  font-family: --font-sans; font-size: 0.85rem; font-style: italic;
        color: rgba(245,239,228,0.75); line-height: 1.55;

.actions: display: flex; gap: 0.5rem; margin-top: 0.6rem;
```

Proactive card content must be specific to the current view context:
- **Dashboard** → urgent tasks, RSVP deadline, overdue deposits
- **Guest list** → unopened invites, dietary conflicts, missing addresses
- **Seating** → table conflicts, unassigned guests, headcount changes
- **Budget** → overspend warnings, upcoming deposits
- **Vendors** → overdue contracts, upcoming deadlines

### Message Thread

```css
flex: 1; overflow-y: auto;
padding: 0.6rem 0.9rem;
display: flex; flex-direction: column; gap: 0.8rem;
```

**Etta messages (left-aligned):**
```css
background: rgba(255,255,255,0.05);
color: rgba(245,239,228,0.82);
font-family: --font-serif; font-size: 0.82rem; line-height: 1.55;
border-radius: 4px 4px 4px 0;  /* open bottom-left corner */
align-self: flex-start;
max-width: 88%; padding: 0.55rem 0.75rem;
```

**User messages (right-aligned):**
```css
background: rgba(196,99,58,0.18);
border: 1px solid rgba(196,99,58,0.25);
color: rgba(245,239,228,0.88);
font-family: --font-serif; font-size: 0.82rem; font-style: italic; line-height: 1.55;
border-radius: 4px 4px 0 4px;  /* open bottom-right corner */
align-self: flex-end;
```

**Timestamps:**
```css
font-family: --font-mono; font-size: 0.52rem; letter-spacing: 0.04em;
color: rgba(245,239,228,0.22);
Etta: text-align: left; User: text-align: right;
```

### Suggestion Chips

```css
display: flex; flex-direction: column; gap: 0.3rem;
padding: 0.4rem 0.9rem;

.chip: font-family: --font-mono; font-size: 0.58rem; letter-spacing: 0.04em;
       background: rgba(255,255,255,0.04);
       border: 1px solid rgba(255,255,255,0.07);
       color: rgba(245,239,228,0.45);
       border-radius: 4px; padding: 0.35rem 0.7rem; text-align: left;
       cursor: pointer;
       hover: { color: #B89A5C; border-color: rgba(184,154,92,0.30); background: rgba(184,154,92,0.06); }
```

Clicking a chip populates the input field. Chips should be phrased as quoted questions, e.g. `"Who's coming from abroad?"`.

### Etta Input

```css
.input-area: padding: 0.7rem 0.9rem; border-top: 1px solid rgba(255,255,255,0.06);
             display: flex; align-items: center; gap: 0.6rem;

.input: flex: 1; background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.08); border-radius: 4px;
        padding: 0.5rem 0.7rem;
        font-family: --font-serif; font-style: italic; font-size: 0.82rem;
        color: rgba(245,239,228,0.60);
        placeholder: rgba(245,239,228,0.28);
        focus: { border-color: rgba(184,154,92,0.40); }

.send-btn: width: 28px; height: 28px; border-radius: 50%;
           background: #C4633A; border: none; color: white; font-size: 0.7rem;
           cursor: pointer;
           hover: { background: #B89A5C; }   /* terra → gold on hover */
           /* Contains → arrow */
```

### Etta Design Rules

1. **Gold is Etta's colour.** `#B89A5C` and `rgba(184,154,92,...)` appear only in the Etta panel, sidebar wedding chip date, and countdown widget. Never elsewhere.
2. **`✦` is Etta's glyph.** Use it to prefix proactive card labels. Do not use it for general UI decoration.
3. **Etta's name is always italic in `--font-display`.** The letter "E" in her avatar, "Etta" in the panel header.
4. **Proactive content is context-aware.** Always tailor the proactive card to the current view. Generic filler is not acceptable.
5. **Etta is always online.** The green dot pulses. Never show Etta as offline or loading (unless actively generating a response).

---

## Countdown Widget

Used on the dashboard hero. Always shows days/hours/minutes to the wedding date.

```css
.hero: background: #2E2620; border-radius: 8px; padding: 1.4rem 1.8rem;
       display: flex; align-items: center; justify-content: space-between;
       position: relative; overflow: hidden;

/* ::before — terra glow top-right */
/* ::after  — decorative ❧ character, very low opacity */

.names:  font-family: --font-display; font-size: 1.6rem; font-style: italic; color: #F5EFE4;
.venue:  font-family: --font-mono; font-size: 0.62rem; color: rgba(245,239,228,0.40);
.num:    font-family: --font-display; font-size: 3rem; color: #F5EFE4; line-height: 1;
.unit:   font-family: --font-mono; font-size: 0.55rem; UPPERCASE; color: rgba(245,239,228,0.30);

.progress-bar: height: 2px; background: rgba(255,255,255,0.08);
.progress-fill: background: linear-gradient(90deg, #C4633A, #B89A5C);
```

Update the countdown with `setInterval` every 30 seconds.

---

## Animation System

### Card / Panel Entrance

```css
@keyframes rise {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Stagger: each major element gets a delay */
.countdown-hero:  { animation: rise 0.5s ease forwards; animation-delay: 0s; }
.mini-stats:      { animation: rise 0.5s ease forwards; animation-delay: 0.08s; }
.card:nth-child(n): { animation-delay: 0.08 + n × 0.04s; }
```

### Table Row Entrance

```css
@keyframes rowIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: none; }
}
tbody tr { animation: rowIn 0.35s ease forwards; }
tbody tr:nth-child(n) { animation-delay: n × 0.02s; }
```

### Transitions

- Interactive elements (hover, active): `transition: all 0.15s`
- Drawer slide: `0.25s cubic-bezier(0.4, 0, 0.2, 1)`
- Bulk bar: `transform 0.2s ease`
- Drawer overlay: `opacity 0.2s`

---

## Dark Mode

The dark theme keeps the **same structural patterns** but uses a warm slate charcoal palette. Key differences:

| Element | Light | Dark |
|---|---|---|
| Page canvas | `#F4EEE3` | `#2A2B2C` |
| Card surface | `#FFFFFF` | `#363738` |
| Secondary surface | `#F5EEE8` | `#424344` |
| Primary text | `#4A3830` | `#EEE8DC` |
| Muted text | `#8B7355` | `#A8A098` |
| Border | `rgba(26,21,16,0.10)` | `rgba(255,255,255,0.10)` |
| Input border | `rgba(26,21,16,0.18)` | `rgba(255,255,255,0.16)` |
| Terra/Primary | `#C4633A` | `#D4713F` (slightly brighter) |
| Sidebar bg | `#F0E8D8` | `#1E2020` |

**The layer hierarchy in dark (darkest → lightest):**
`#1E2020` sidebar → `#2A2B2C` background → `#363738` card → `#424344` secondary → `#4E5052` border

Each step is ~+0.07 OKLCH lightness — distinct without jarring contrast.

**Why warm slate:** Dark surfaces use hue ~200° (near-neutral, very low chroma) while foreground text uses hue ~72° (slightly warm). This gives "cool background, warm text" balance — no purple cast, no muddy brown, just clean graphite coherent with the light theme.

**Elements that do NOT change in dark mode:**
- Sidebar/Etta panel bg (`--ink-soft` / `#2E2620`) — always dark
- Gold (`#B89A5C`) — Etta accent, unchanged
- Active nav border (`#D4713F`) — terra, slightly brighter version

**Dark-specific component adjustments:**
- Cards: `box-shadow: var(--shadow-sm)` to lift from bg
- Filter bar: `background: rgba(42,43,44,0.60); backdrop-filter: blur(8px)`
- Topbar: `background: rgba(42,43,44,0.75); backdrop-filter: blur(8px)`
- Card hover: `background: rgba(255,255,255,0.04)`
- Section labels `::after`: `background: rgba(255,255,255,0.08)`
- Input fields: `background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.16)`
- Ghost buttons: `border-color: rgba(255,255,255,0.16); color: rgba(238,232,220,0.60)`

Apply dark mode via the `.dark` class on `<html>` (Tailwind convention).

---

## Spacing & Geometry Reference

| Context | Value |
|---|---|
| Card border-radius | `8px` |
| Button border-radius | `2px` |
| Input border-radius | `4px` |
| Pill/tag border-radius | `20px` |
| Add-target border-radius | `6px` |
| Avatar border-radius | `50%` |
| Sidebar width | `220px` |
| Topbar height | `56px` |
| Etta panel width | `272–300px` |
| Drawer width | `400px` |
| Dashboard padding | `1.6rem 1.8rem` |
| Card gap (grid) | `0.8rem` |
| Section card gap | `1.4rem` |
| Card padding | `1rem–2.5rem` |

---

## Section Label Pattern (hairline rule)

This pattern is required for any labelled section inside a drawer, card, or panel:

```html
<div class="section-label">Section name</div>
```

```css
.section-label {
  display: flex; align-items: center; gap: 0.5rem;
  font-family: var(--font-mono); font-size: 0.58rem;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: #8B7355; margin-bottom: 0.65rem;
}
.section-label::after {
  content: ''; flex: 1; height: 1px;
  background: rgba(26,21,16,0.10);
}
```

The label text floats left; a hairline extends to the right edge. Use this pattern consistently — it is a signature structural element of OSWP's visual language.
