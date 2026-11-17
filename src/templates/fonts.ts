/**
 * Wedding Template Fonts
 *
 * Each template plugin can pull in its own typefaces. Fonts are loaded once
 * here (next/font requires module-scope calls) and exposed as CSS variables so
 * a template's theme can reference them via `var(--tpl-...)`. Attaching the
 * generated `.variable` className to the template root makes the variable
 * available to every surface rendered inside it.
 *
 * Self-hosted from `src/fonts` (latin subset, OFL licensed) rather than
 * next/font/google, which downloads every font from Google at build time and
 * fails the build whenever that request does. A variable font file covers a
 * weight range, so it is declared once with that range.
 */

import localFont from 'next/font/local'

/** Classic template — warm editorial serif (matches the original hardcoded site). */
export const classicSerif = localFont({
  src: [
    { path: '../fonts/crimson-text/crimson-text-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/crimson-text/crimson-text-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/crimson-text/crimson-text-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/crimson-text/crimson-text-400-italic.woff2', weight: '400', style: 'italic' },
    { path: '../fonts/crimson-text/crimson-text-600-italic.woff2', weight: '600', style: 'italic' },
    { path: '../fonts/crimson-text/crimson-text-700-italic.woff2', weight: '700', style: 'italic' },
  ],
  variable: '--tpl-classic-serif',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
})

/** Aurelia template — high-contrast display serif for headings. */
export const aureliaSerif = localFont({
  src: [
    {
      path: '../fonts/playfair-display/playfair-display-variable-normal.woff2',
      weight: '400 700',
      style: 'normal',
    },
    {
      path: '../fonts/playfair-display/playfair-display-variable-italic.woff2',
      weight: '400 700',
      style: 'italic',
    },
  ],
  variable: '--tpl-aurelia-serif',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
})

/** Aurelia template — clean geometric sans for body copy and navigation. */
export const aureliaSans = localFont({
  src: [{ path: '../fonts/jost/jost-variable-normal.woff2', weight: '300 500', style: 'normal' }],
  variable: '--tpl-aurelia-sans',
  display: 'swap',
  adjustFontFallback: 'Arial',
})

/**
 * Voyage template — high-contrast editorial display serif for headlines. Thin
 * elegant strokes with a romantic italic for emphasis.
 */
export const voyageDisplay = localFont({
  src: [
    {
      path: '../fonts/cormorant-garamond/cormorant-garamond-variable-normal.woff2',
      weight: '300 600',
      style: 'normal',
    },
    {
      path: '../fonts/cormorant-garamond/cormorant-garamond-variable-italic.woff2',
      weight: '300 600',
      style: 'italic',
    },
  ],
  variable: '--tpl-voyage-display',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
})

/** Voyage template — refined readable serif for body copy. */
export const voyageBody = localFont({
  src: [
    {
      path: '../fonts/eb-garamond/eb-garamond-variable-normal.woff2',
      weight: '400 500',
      style: 'normal',
    },
    {
      path: '../fonts/eb-garamond/eb-garamond-variable-italic.woff2',
      weight: '400 500',
      style: 'italic',
    },
  ],
  variable: '--tpl-voyage-body',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
})

/** Voyage template — refined humanist sans for nav, labels, and buttons. */
export const voyageSans = localFont({
  src: [
    { path: '../fonts/mulish/mulish-variable-normal.woff2', weight: '300 600', style: 'normal' },
  ],
  variable: '--tpl-voyage-sans',
  display: 'swap',
  adjustFontFallback: 'Arial',
})

/** Voyage template — flowing calligraphy script for romantic flavour phrases. */
export const voyageScript = localFont({
  src: [
    { path: '../fonts/great-vibes/great-vibes-400-normal.woff2', weight: '400', style: 'normal' },
  ],
  variable: '--tpl-voyage-script',
  display: 'swap',
  adjustFontFallback: 'Arial',
})
