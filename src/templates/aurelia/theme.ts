import type { CSSProperties } from 'react'
import { aureliaSans, aureliaSerif } from '~/templates/fonts'
import type { TemplateTheme } from '~/templates/types'

/**
 * Aurelia theme — clean and elegant. A pale lavender backdrop, deep indigo ink,
 * a rich violet primary and a cool blue accent. Headings use a high-contrast
 * display serif (Playfair Display); body and navigation use a calm geometric
 * sans (Jost).
 *
 * The colour tokens override the app design variables, so the violet/blue
 * palette also flows through shared surfaces such as the RSVP form.
 */
const cssVars: CSSProperties = {
  '--background': '0.981 0.012 292',
  '--foreground': '0.286 0.064 283',
  '--card': '1 0 0',
  '--card-foreground': '0.286 0.064 283',
  '--primary': '0.505 0.176 291',
  '--primary-foreground': '0.99 0.005 290',
  '--secondary': '0.93 0.035 262',
  '--secondary-foreground': '0.36 0.11 283',
  '--muted': '0.95 0.018 290',
  '--muted-foreground': '0.512 0.05 280',
  '--accent': '0.62 0.13 256',
  '--accent-foreground': '0.99 0.005 290',
  '--border': '0.9 0.025 290',
  '--input': '0.9 0.025 290',
  '--ring': '0.505 0.176 291',
  '--tpl-heading-font': 'var(--tpl-aurelia-serif)',
  '--tpl-body-font': 'var(--tpl-aurelia-sans)',
} as CSSProperties

export const aureliaTheme: TemplateTheme = {
  fontClassName: `${aureliaSerif.variable} ${aureliaSans.variable}`,
  rootClassName: 'bg-background text-foreground font-[family-name:var(--tpl-body-font)]',
  cssVars,
}
