/**
 * Wedding Template Fonts
 *
 * Each template plugin can pull in its own typefaces. Fonts are loaded once
 * here (next/font requires module-scope calls) and exposed as CSS variables so
 * a template's theme can reference them via `var(--tpl-...)`. Attaching the
 * generated `.variable` className to the template root makes the variable
 * available to every surface rendered inside it.
 */

import { Crimson_Text, Jost, Playfair_Display } from 'next/font/google'

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
