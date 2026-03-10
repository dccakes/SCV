# OSWP Component Library

Specs for every reusable component in the OSWP application.

---

## Buttons

### Sizes & Shape
All buttons: `border-radius: 2px` — never pill-shaped. Tag this as non-negotiable.

| Size | Font | Padding | Letter-spacing |
|---|---|---|---|
| Default | `--font-mono`, `0.62–0.72rem` | `0.38rem 0.9rem` | `0.1em` UPPERCASE |
| Small | `--font-mono`, `0.58–0.62rem` | `0.28rem 0.65rem` | `0.08em` UPPERCASE |
| Inline action | `--font-mono`, `0.55–0.58rem` | `0.2rem 0.5rem` | `0.06em` UPPERCASE |

### Variants

**Primary (dark):**
```css
background: var(--ink) / #1A1510;
color: var(--sidebar-cream);
border: 1px solid var(--ink);
hover: { background: #C4633A; border-color: #C4633A; }
```
Tailwind: `bg-foreground text-background border-foreground hover:bg-primary hover:border-primary`

**Primary (terra):**
```css
background: #C4633A;
color: #F5EFE4;
border: 1px solid #C4633A;
hover: { background: #B89A5C; border-color: #B89A5C; }
```
Tailwind: `bg-primary text-primary-foreground hover:bg-accent`

**Ghost:**
```css
background: none;
color: #8B7355;  /* --mid */
border: 1px solid rgba(26,21,16,0.18);
hover: { border-color: #1A1510; color: #1A1510; }
```
Tailwind: `bg-transparent text-muted-foreground border-input hover:border-foreground hover:text-foreground`

**Ghost on dark (used inside Etta panel):**
```css
background: none;
color: rgba(245,239,228,0.60);
border: 1px solid rgba(245,239,228,0.15);
hover: { border-color: #B89A5C; color: #B89A5C; }
```

**Nudge / inline action (pending state):**
```css
background: none;
color: #C4633A;
border: 1px solid rgba(196,99,58,0.30);
hover: { background: #C4633A; color: #F5EFE4; }
/* sent/done state: */
background: rgba(107,122,94,0.10);
border-color: #6B7A5E;
color: #6B7A5E;
cursor: default;
```

**Dashed add button (party members, tags):**
```css
border: 1px dashed rgba(196,99,58,0.30);
color: #C4633A;
background: none;
border-radius: 6px;  /* exception — slightly rounded for add targets */
hover: { background: rgba(196,99,58,0.05); border-style: solid; }
```

---

## Tags & Pills

Tags and pills always use `border-radius: 20px`. Font is `--font-mono`.

### RSVP Pills

```css
/* base */
font-family: --font-mono; font-size: 0.54–0.60rem;
letter-spacing: 0.06em; text-transform: uppercase;
padding: 0.18–0.22rem 0.50–0.60rem;
border-radius: 20px;

/* with leading dot */
.rsvp-dot { width: 4–5px; height: 4–5px; border-radius: 50%; background: currentColor; }
```

| State | Background | Text |
|---|---|---|
| Confirmed | `rgba(107,122,94,0.12)` | `#6B7A5E` (sage) |
| Pending | `rgba(196,99,58,0.10)` | `#C4633A` (terra) |
| Declined | `rgba(139,115,85,0.10)` | `#8B7355` (mid) |

### Guest Tags (freeform, colour-coded)

Predefined colour map by tag type:

| Tag type | Background | Text |
|---|---|---|
| Bridesmaid | `rgba(107,122,94,0.12)` | `#6B7A5E` |
| Best man | `rgba(184,154,92,0.15)` | `#9a7f3e` |
| Family / Close family | `rgba(196,99,58,0.10–0.15)` | `#C4633A` |
| University / School | `rgba(139,115,85,0.12)` | `#8B7355` |
| Work / Colleague | `rgba(26,21,16,0.07)` | `#8B7355` |
| Custom / Unknown | `rgba(26,21,16,0.07)` | `#8B7355` |

Tags in the drawer header have a ✕ remove button (`opacity: 0.5`, hover `opacity: 1`).

### Dietary Tags

```
Vegetarian / Vegan: bg rgba(107,122,94,0.10), text #6B7A5E
Other (halal, GF, nut): bg rgba(184,154,92,0.10), text #9a7f3e
None: text rgba(139,115,85,0.35), no background  →  render as "—"
```

### Nav Badges (count indicators)

```css
background: #C4633A; color: #F5EFE4;
font-family: --font-mono; font-size: 0.52rem;
padding: 0.15rem 0.4rem; border-radius: 20px;
margin-left: auto;
```

---

## Cards

All content cards follow this baseline.

```css
background: rgba(245,239,228,0.65);  /* semi-transparent over cream canvas */
border: 1px solid rgba(26,21,16,0.10);
border-radius: 8px;
cursor: pointer;
transition: background 0.15s, box-shadow 0.15s, transform 0.12s;
```

**Hover state:**
```css
background: #EDE5D5;
box-shadow: 0 4px 16px rgba(26,21,16,0.08);
transform: translateY(-1px);
```

**Selected state:**
```css
background: rgba(196,99,58,0.06);
border-color: rgba(196,99,58,0.35);
/* ::before pseudo-element: */
position: absolute; top: 0; left: 0; right: 0; height: 2px;
background: #C4633A;
```

**Entrance animation (staggered):**
```css
@keyframes cardIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
}
.card { animation: cardIn 0.4s ease both; }
.card:nth-child(n) { animation-delay: n × 0.04s; }
```

### Dark Cards (ink background)

For countdown hero, Etta proactive zones, dark feature panels:
```css
background: #2E2620;  /* --ink-soft */
border: 1px solid rgba(255,255,255,0.04–0.08);
/* Corner glow decorations: */
radial-gradient(rgba(196,99,58,0.15–0.20), transparent)  /* terra glow */
radial-gradient(rgba(184,154,92,0.10), transparent)       /* gold glow (Etta only) */
```

### Card Avatars (initials)

Rotating palette — assign by `id % 4`:

| Index | Background | Text |
|---|---|---|
| 0 | `rgba(107,122,94,0.18)` | `#6B7A5E` |
| 1 | `rgba(184,154,92,0.20)` | `#9a7f3e` |
| 2 | `rgba(196,99,58,0.15)` | `#C4633A` |
| 3 | `rgba(139,115,85,0.18)` | `#8B7355` |

Avatar sizes: `36×36px` (cards), `44×44px` (drawer header), `28×28px` (party members), `30×30px` (user/sidebar).

---

## Drawers

Slide-in detail panel from the right.

```css
width: 400px;
background: #F5EFE4;  /* --cream */
border-left: 1px solid rgba(26,21,16,0.18);
box-shadow: -8px 0 40px rgba(26,21,16,0.14);
transform: translateX(100%);
transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
```

**Overlay:**
```css
background: rgba(26,21,16,0.30);
transition: opacity 0.2s;
```

### Drawer Section Labels

Required pattern for every section heading inside a drawer:

```css
/* Layout: label text + hairline rule stretching to edge */
display: flex; align-items: center; gap: 0.5rem;
font-family: --font-mono; font-size: 0.58rem;
letter-spacing: 0.14em; text-transform: uppercase;
color: #8B7355;  /* --mid */
margin-bottom: 0.65rem;

.section-label::after {
  content: '';
  flex: 1; height: 1px;
  background: rgba(26,21,16,0.10);
}
```

Use this pattern consistently everywhere a section needs a label — in drawers, cards with sections, and panel zones.

### Drawer Detail Grid

```css
display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;

label: font-family: --font-mono; font-size: 0.55rem; letter-spacing: 0.10em; UPPERCASE; color: #8B7355;
value: font-family: --font-sans; font-size: 0.92rem; color: #1A1510;
empty: font-style: italic; font-size: 0.85rem; color: rgba(139,115,85,0.40);
address: grid-column: 1 / -1; line-height: 1.5; font-size: 0.85rem;
```

### Drawer Footer

```css
padding: 0.9rem 1.4rem;
border-top: 1px solid rgba(26,21,16,0.10);
display: flex; gap: 0.6rem;

/* Each button: flex: 1 */
```

---

## Forms & Inputs

```css
background: #F5EFE4;   /* --cream */
border: 1px solid rgba(26,21,16,0.18);
border-radius: 4px;
font-family: --font-sans; font-size: 0.88rem; color: #1A1510;
padding: 0.4–0.6rem 0.8rem;
outline: none;
transition: border-color 0.15s;
focus: { border-color: #C4633A; }
```

**Textarea (notes):**
```css
resize: none; min-height: 65–70px; line-height: 1.55;
font-style: normal;  /* not italic */
```

**Search input (filter bar):**
```css
/* prefix icon ⌕ absolutely positioned at left: 0.7rem */
padding-left: 2rem;
```

---

## Filter Bar

```css
background: rgba(245,239,228,0.40);
border-bottom: 1px solid rgba(26,21,16,0.10);
padding: 0.8–0.9rem 1.8rem;
display: flex; align-items: center; gap: 0.7–0.8rem; flex-wrap: wrap;
```

### Segmented Filter Tabs

```css
/* container */
display: flex; gap: 2px; background: rgba(26,21,16,0.10);
border-radius: 4px; padding: 2px;

/* tab */
font-family: --font-mono; font-size: 0.60rem; letter-spacing: 0.08em; UPPERCASE;
color: #8B7355; background: none; border: none;
border-radius: 3px; padding: 0.30rem 0.70rem;
display: flex; align-items: center; gap: 0.35rem;

/* active tab */
background: #F5EFE4; color: #1A1510;
box-shadow: 0 1px 3px rgba(0,0,0,0.08);

/* count badge inside tab */
active: { background: #C4633A; color: #F5EFE4; }
inactive: { background: rgba(139,115,85,0.20); color: #8B7355; }
```

### Dividers (within filter bar)

```css
width: 1px; height: 20px; background: rgba(26,21,16,0.18);
```

---

## Tables

Used for dense data views where cards aren't appropriate.

```css
width: 100%; border-collapse: collapse;
```

**Header (sticky):**
```css
position: sticky; top: 0; z-index: 10;
background: rgba(237,229,213,0.95);
backdrop-filter: blur(6px);

th: font-family: --font-mono; font-size: 0.58rem; letter-spacing: 0.14em; UPPERCASE; color: #8B7355;
    border-bottom: 1px solid rgba(26,21,16,0.18);
    padding: 0.65rem 1rem;
    cursor: pointer; /* sortable */
    hover: { color: #1A1510; }
    sorted: { color: #1A1510; }
```

**Rows:**
```css
td: padding: 0.65rem 1rem; border-bottom: 1px solid rgba(26,21,16,0.10);
tr hover: { background: rgba(237,229,213,0.50); }
tr selected: { background: rgba(196,99,58,0.05); border-left: 2px solid #C4633A; }
```

**Row entrance animation:**
```css
tbody tr { opacity: 0; animation: rowIn 0.35s ease forwards; }
tbody tr:nth-child(n) { animation-delay: n × 0.02s; }
@keyframes rowIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
```

---

## RSVP Status Block (drawer)

Full-size status display at the top of a guest detail drawer.

```css
display: flex; align-items: center; justify-content: space-between;
padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid;
```

| State | Block bg | Border | Icon bg | Icon colour |
|---|---|---|---|---|
| Confirmed | `rgba(107,122,94,0.06)` | `rgba(107,122,94,0.18)` | `rgba(107,122,94,0.15)` | `#6B7A5E` |
| Pending | `rgba(196,99,58,0.05)` | `rgba(196,99,58,0.18)` | `rgba(196,99,58,0.12)` | `#C4633A` |
| Declined | `rgba(139,115,85,0.05)` | `rgba(139,115,85,0.14)` | `rgba(139,115,85,0.10)` | `#8B7355` |

Icon: 24×24px circle. Icons: ✓ / … / ✕

---

## Communication Log

Timeline of sent / opened / responded events in a drawer.

```css
.comm-dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 0.35rem; flex-shrink: 0; }
.comm-dot.sent   { background: #6B7A5E; }  /* sage */
.comm-dot.opened { background: #B89A5C; }  /* gold */
.comm-dot.replied { background: #C4633A; } /* terra */

.comm-text { font-family: --font-serif; font-size: 0.84rem; color: #1A1510; line-height: 1.4; }
.comm-date { font-family: --font-mono; font-size: 0.56rem; color: #8B7355; letter-spacing: 0.05em; }
```

---

## Bulk Action Bar

Appears when one or more items are selected. Sticks to bottom of the scrollable area.

```css
position: sticky; bottom: 0;
background: #2E2620; /* --ink-soft */
border-top: 1px solid rgba(255,255,255,0.06);
padding: 0.65–0.7rem 1.8rem;
display: flex; align-items: center; gap: 0.8rem;
transform: translateY(100%);
transition: transform 0.2s ease;
/* .visible class: transform: translateY(0); */

count: font-family: --font-mono; font-size: 0.68rem; color: #F5EFE4; letter-spacing: 0.08em;
action btns: ghost-on-dark variant (see Buttons section)
danger hover: border-color #C4633A; color #C4633A;
close/clear: rgba(245,239,228,0.30), hover #F5EFE4
```

---

## Scrollbars (all scrollable areas)

```css
::-webkit-scrollbar       { width: 4–5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(26,21,16,0.12–0.15); border-radius: 2–3px; }

/* Dark panels (Etta, sidebar): */
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); }
```

---

## Empty States

When a list or grid has no content:

```css
text-align: center; padding: 4rem;
font-family: --font-mono; font-size: 0.72rem;
color: #8B7355; letter-spacing: 0.10em; text-transform: uppercase;
```

Example: `"No guests match your search"`

---

## Mini Stats Row

4-column grid of quick stats (as seen on the dashboard).

```css
display: grid; grid-template-columns: repeat(4, 1fr);
gap: 1px; /* creates hairline dividers via grid gap */
background: rgba(26,21,16,0.10);
border: 1px solid rgba(26,21,16,0.10);
border-radius: 8px; overflow: hidden;

.mini-stat: background: rgba(245,239,228,0.60); padding: 0.9rem 1.1rem;
  display: flex; align-items: center; gap: 0.8rem;
  hover: { background: #EDE5D5; }

.stat-value: font-family: --font-display; font-size: 1.4rem; color: #1A1510;
.stat-label: font-family: --font-mono; font-size: 0.56rem; UPPERCASE; color: #8B7355;
.stat-delta: font-family: --font-mono; font-size: 0.58rem; color: #6B7A5E; /* or terra if negative */
```
