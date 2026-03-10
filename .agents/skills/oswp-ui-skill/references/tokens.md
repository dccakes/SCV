# OSWP Token Reference

Full CSS variable system for OSWP. Variables follow shadcn/ui OKLCH conventions.

---

## globals.css — Full Token Map

```css
@layer base {
  :root {
    /* ── Surfaces ── */
    --background: 0.9538 0.016 82.79;        /* #F4EEE3 — warm cream page canvas */
    --foreground: 0.3353 0.0132 2.7676;      /* #4A3830 — primary ink text */

    --card: 1 0 0;                            /* #FFFFFF — card surfaces */
    --card-foreground: 0.3353 0.0132 2.7676; /* same as foreground */

    --popover: 1 0 0;
    --popover-foreground: 0.3353 0.0132 2.7676;

    /* ── Brand ── */
    --primary: 0.7357 0.1641 34.7091;        /* #C4633A — terracotta, primary accent */
    --primary-foreground: 1 0 0;             /* white on terracotta */

    --secondary: 0.9596 0.02 28.9029;        /* #F5EEE8 — warm off-white secondary */
    --secondary-foreground: 0.5587 0.1294 32.7364; /* #9A6040 — warm brown */

    --muted: 0.9656 0.0176 39.4009;          /* #F0E8DC — muted surface */
    --muted-foreground: 0.5534 0.0116 58.0708; /* #8B7355 — mid brown */

    --accent: 0.6997 0.0882 84.38;           /* #9A8A58 — gold-adjacent accent */
    --accent-foreground: 0.3353 0.0132 2.7676;

    /* ── Feedback ── */
    --success: 0.768 0.161 151.95;           /* #6B7A5E — sage green, confirmed */
    --success-foreground: 0.985 0.01 151.5;

    --destructive: 0.6122 0.2082 22.241;     /* #C4472A — error/destructive */
    --destructive-foreground: 1 0 0;

    /* ── Chrome ── */
    --border: 0.9296 0.037 38.6868;          /* rgba(26,21,16,0.10) equivalent */
    --input: 0.9296 0.037 38.6868;
    --ring: 0.7357 0.1641 34.7091;           /* focus ring = primary */

    /* ── Radius ── */
    --radius: 0.625rem;                       /* base radius, cards use 8px directly */

    /* ── Charts ── */
    --chart-1: 0.7357 0.1641 34.7091;        /* terra */
    --chart-2: 0.8278 0.1131 57.9984;        /* gold */
    --chart-3: 0.8773 0.0763 54.9314;        /* light gold */
    --chart-4: 0.82 0.1054 40.8859;          /* warm mid */
    --chart-5: 0.6368 0.1306 32.0721;        /* deep terra */

    /* ── Sidebar ── */
    --sidebar: 0.9656 0.0176 39.4009;        /* #F0E8D8 — sidebar light bg */
    --sidebar-foreground: 0.3353 0.0132 2.7676;
    --sidebar-primary: 0.7357 0.1641 34.7091;
    --sidebar-primary-foreground: 1 0 0;
    --sidebar-accent: 0.8278 0.1131 57.9984;
    --sidebar-accent-foreground: 0.3353 0.0132 2.7676;
    --sidebar-border: 0.9296 0.037 38.6868;
    --sidebar-ring: 0.7357 0.1641 34.7091;

    /* ── Custom OSWP tokens (not OKLCH — use as-is) ── */
    --sidebar-ink: 0.19 0.022 48;            /* #2E2620 — dark sidebar/Etta bg */
    --sidebar-cream: 0.96 0.01 56;           /* #F5EFE4 — text on dark sidebar */
    --etta-ink: 0.19 0.022 48;              /* same as sidebar-ink */

    /* ── Typography ── */
    --font-sans: Montserrat, sans-serif;
    --font-serif: Merriweather, serif;
    --font-mono: Ubuntu Mono, monospace;
    --font-display: var(--font-instrument, "Instrument Serif", serif);

    /* ── Shadows ── */
    --shadow-color: hsl(0 0% 0%);
    --shadow-opacity: 0.09;
    --shadow-sm: 0px 6px 12px -3px hsl(0 0% 0% / 0.09), 0px 1px 2px -4px hsl(0 0% 0% / 0.09);
    --shadow:    0px 6px 12px -3px hsl(0 0% 0% / 0.09), 0px 1px 2px -4px hsl(0 0% 0% / 0.09);
    --shadow-md: 0px 6px 12px -3px hsl(0 0% 0% / 0.09), 0px 2px 4px -4px hsl(0 0% 0% / 0.09);
    --shadow-lg: 0px 6px 12px -3px hsl(0 0% 0% / 0.09), 0px 4px 6px -4px hsl(0 0% 0% / 0.09);
    --shadow-xl: 0px 6px 12px -3px hsl(0 0% 0% / 0.09), 0px 8px 10px -4px hsl(0 0% 0% / 0.09);
    --shadow-2xl: 0px 6px 12px -3px hsl(0 0% 0% / 0.22);

    --letter-spacing: 0em;
    --spacing: 0.25rem;
    --tracking-normal: 0em;
  }

  /* ── DARK MODE ── */
  .dark {
    --background: 0.2200 0.0050 200.00;      /* #2A2B2C — warm slate charcoal */
    --foreground: 0.9380 0.0120 72.00;       /* #EEE8DC — soft warm white */

    --card: 0.2900 0.0045 200.00;            /* #363738 — lifted +0.07L above bg */
    --card-foreground: 0.9380 0.0120 72.00;

    --popover: 0.2900 0.0045 200.00;
    --popover-foreground: 0.9380 0.0120 72.00;

    --primary: 0.7600 0.1641 34.71;          /* #D4713F — slightly brighter terra */
    --primary-foreground: 1 0 0;

    --secondary: 0.3500 0.0040 200.00;       /* #424344 — readable step above card */
    --secondary-foreground: 0.9380 0.0120 72.00;

    --muted: 0.2900 0.0045 200.00;           /* #363738 — same as card */
    --muted-foreground: 0.6800 0.0180 72.00; /* #A8A098 — warm grey secondary text */

    --accent: 0.7600 0.1000 68.00;           /* #C8A060 — richer gold on slate */
    --accent-foreground: 0.2200 0.0050 200.00;

    --success: 0.6200 0.1000 151.00;         /* #5A8A6A — brighter sage */
    --success-foreground: 0.9600 0.0120 151.00;

    --destructive: 0.6122 0.2082 22.241;
    --destructive-foreground: 1 0 0;

    --border: 0.3900 0.0060 200.00;          /* #4E5052 — clearly visible on all surfaces */
    --input: 0.3900 0.0060 200.00;
    --ring: 0.7600 0.1641 34.71;

    --chart-1: 0.7600 0.1641 34.71;
    --chart-2: 0.7600 0.1000 68.00;
    --chart-3: 0.8773 0.0763 54.9314;
    --chart-4: 0.82 0.1054 40.8859;
    --chart-5: 0.6368 0.1306 32.0721;

    --sidebar: 0.1700 0.0040 200.00;         /* #1E2020 — darker than bg, clear depth */
    --sidebar-foreground: 0.9380 0.0120 72.00;
    --sidebar-primary: 0.7600 0.1641 34.71;
    --sidebar-primary-foreground: 1 0 0;
    --sidebar-accent: 0.7600 0.1000 68.00;
    --sidebar-accent-foreground: 0.2200 0.0050 200.00;
    --sidebar-border: 0.3900 0.0060 200.00;
    --sidebar-ring: 0.7600 0.1641 34.71;

    /* ── OSWP custom tokens (unchanged in dark) ── */
    --sidebar-ink: 0.19 0.022 48;
    --sidebar-cream: 0.96 0.01 56;
    --etta-ink: 0.19 0.022 48;

    --font-sans: Montserrat, sans-serif;
    --font-serif: Merriweather, serif;
    --font-mono: Ubuntu Mono, monospace;
    --font-display: var(--font-instrument, "Instrument Serif", serif);
  }
}
```

---

## Hex Quick Reference

These are approximate hex equivalents for the key OKLCH values, for use in plain CSS or prototyping.

### Light Mode

| Token | Hex | Notes |
|---|---|---|
| `--background` | `#F4EEE3` | Warm cream — page canvas |
| `--foreground` | `#4A3830` | Dark warm ink |
| `--card` | `#FFFFFF` | Card surfaces |
| `--primary` | `#C4633A` | Terracotta — primary accent |
| `--secondary` | `#F5EEE8` | Off-white secondary surface |
| `--muted` | `#F0E8DC` | Muted background |
| `--muted-foreground` | `#8B7355` | Secondary text |
| `--success` | `#6B7A5E` | Sage — confirmed/success |
| `--accent` | `#9A8A58` | Gold-adjacent |
| `--border` | `#EADDD0` | Light divider |
| `--sidebar` | `#F0E8D8` | Sidebar light bg |
| `--sidebar-ink` | `#2E2620` | Dark sidebar/Etta bg |
| `--sidebar-cream` | `#F5EFE4` | Text on dark sidebar |

### Dark Mode

| Token | Hex | Notes |
|---|---|---|
| `--background` | `#2A2B2C` | Warm slate charcoal — neutral, no brown/purple cast |
| `--foreground` | `#EEE8DC` | Soft warm white — readable on slate |
| `--card` | `#363738` | +0.07L above bg — clearly distinct surface |
| `--secondary` | `#424344` | +0.06L above card — visible layer step |
| `--muted` | `#363738` | Same as card |
| `--muted-foreground` | `#A8A098` | Warm grey secondary text |
| `--border` | `#4E5052` | Visible on all surfaces |
| `--primary` | `#D4713F` | Slightly brighter terra for dark bg contrast |
| `--accent` | `#C8A060` | Richer gold — pops on slate |
| `--success` | `#5A8A6A` | Brighter sage — clear signal |
| `--sidebar` | `#1E2020` | Notably darker than bg — strong depth cue |

### Fixed Accent Palette (same in light and dark)

These are not Tailwind tokens — use as raw CSS values:

| Name | Hex | Token alias |
|---|---|---|
| Terra | `#C4633A` | `--primary` |
| Sage | `#6B7A5E` | `--success` |
| Gold | `#B89A5C` | (Etta-only, no Tailwind alias) |
| Mid | `#8B7355` | `--muted-foreground` |
| Ink-soft | `#2E2620` | `--etta-ink` / `--sidebar-ink` |
| Cream | `#F5EFE4` | `--sidebar-cream` |
| Line | `rgba(26,21,16,0.10)` | `--border` (light) |
| Line-heavy | `rgba(26,21,16,0.18)` | `--input` (light) |

---

## Dark Mode — Opacity Text Layers

On dark backgrounds (`--ink-soft` / `#2E2620`), text uses opacity variants of `--sidebar-cream` (`#F5EFE4`):

| Role | Value |
|---|---|
| Primary heading | `rgba(245,239,228,0.95)` |
| Body text | `rgba(245,239,228,0.75–0.82)` |
| Secondary / labels | `rgba(245,239,228,0.50–0.65)` |
| Muted / metadata | `rgba(245,239,228,0.25–0.35)` |
| Disabled / inactive | `rgba(245,239,228,0.15)` |

This applies to: sidebar nav items, Etta panel text, dark card content. Do not use opacity text on light (cream) backgrounds — use the semantic foreground tokens instead.

---

## Tailwind Config Conventions

```js
// tailwind.config.js — colour mapping
colors: {
  background: 'oklch(var(--background))',
  foreground: 'oklch(var(--foreground))',
  card: {
    DEFAULT: 'oklch(var(--card))',
    foreground: 'oklch(var(--card-foreground))',
  },
  primary: {
    DEFAULT: 'oklch(var(--primary))',
    foreground: 'oklch(var(--primary-foreground))',
  },
  // ... etc following shadcn/ui conventions
}
```

Apply as Tailwind utility classes: `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-card`, `border-border`, `text-muted-foreground`, `bg-muted`, `text-success`, etc.
