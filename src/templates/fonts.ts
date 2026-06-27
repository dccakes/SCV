/**
 * Wedding Template Fonts
 *
 * Each template plugin can pull in its own typefaces. Fonts are loaded once
 * here (next/font requires module-scope calls) and exposed as CSS variables so
 * a template's theme can reference them via `var(--tpl-...)`. Attaching the
 * generated `.variable` className to the template root makes the variable
 * available to every surface rendered inside it.
 */

import {
  Cormorant_Garamond,
  Crimson_Text,
  EB_Garamond,
  Jost,
  Mulish,
  Playfair_Display,
} from 'next/font/google'

/** Classic template — warm editorial serif (matches the original hardcoded site). */
export const classicSerif = Crimson_Text({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--tpl-classic-serif',
  display: 'swap',
})

/** Aurelia template — high-contrast display serif for headings. */
export const aureliaSerif = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--tpl-aurelia-serif',
  display: 'swap',
})

/** Aurelia template — clean geometric sans for body copy and navigation. */
export const aureliaSans = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--tpl-aurelia-sans',
  display: 'swap',
})

/**
 * Voyage template — high-contrast editorial display serif for headlines. Thin
 * elegant strokes with a romantic italic for emphasis.
 */
export const voyageDisplay = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--tpl-voyage-display',
  display: 'swap',
})

/** Voyage template — refined readable serif for body copy. */
export const voyageBody = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--tpl-voyage-body',
  display: 'swap',
})

/** Voyage template — refined humanist sans for nav, labels, and buttons. */
export const voyageSans = Mulish({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--tpl-voyage-sans',
  display: 'swap',
})
