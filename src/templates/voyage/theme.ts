import type { CSSProperties } from 'react'
import { voyageBody, voyageDisplay, voyageSans } from '~/templates/fonts'
import type { TemplateTheme } from '~/templates/types'

/**
 * Voyage theme — a refined luxury destination-wedding palette. Warm ivory and
 * soft parchment backgrounds, soft-black ink, a champagne-gold primary and warm
 * beige linework. Headlines use a high-contrast editorial serif (Cormorant
 * Garamond); body copy uses a readable serif (EB Garamond); navigation, labels
 * and buttons use a refined humanist sans (Mulish) with wide tracking.
 *
 * The colour tokens override the app design variables, so the ivory/champagne
 * palette also flows through shared surfaces such as the RSVP form.
 *
 * oklch values are `L C H` triples consumed via `oklch(var(--token))`.
 */
const cssVars: CSSProperties = {
  // Warm ivory / soft parchment surface, soft-black ink.
  '--background': '0.9648 0.0127 86.83',
  '--foreground': '0.2272 0.0081 84.59',
  // Cards sit on soft cream with the same warm ink.
  '--card': '0.9795 0.0098 87.47',
  '--card-foreground': '0.2272 0.0081 84.59',
  '--popover': '0.9795 0.0098 87.47',
  '--popover-foreground': '0.2272 0.0081 84.59',
  // Champagne gold primary; dark espresso text rides on it for contrast.
  '--primary': '0.6863 0.0921 80.27',
  '--primary-foreground': '0.2007 0.0101 88.81',
  // Pale sand secondary.
  '--secondary': '0.9070 0.0212 79.09',
  '--secondary-foreground': '0.2272 0.0081 84.59',
  // Muted cream + taupe-grey muted text.
  '--muted': '0.9795 0.0098 87.47',
  '--muted-foreground': '0.5406 0.0169 80.66',
  // Champagne accent.
  '--accent': '0.6863 0.0921 80.27',
  '--accent-foreground': '0.2007 0.0101 88.81',
  // Warm beige borders and inputs; champagne focus ring.
  '--border': '0.8736 0.0243 79.73',
  '--input': '0.8736 0.0243 79.73',
  '--ring': '0.6863 0.0921 80.27',
  '--tpl-heading-font': 'var(--tpl-voyage-display)',
  '--tpl-body-font': 'var(--tpl-voyage-body)',
  '--tpl-label-font': 'var(--tpl-voyage-sans)',
} as CSSProperties

export const voyageTheme: TemplateTheme = {
  fontClassName: `${voyageDisplay.variable} ${voyageBody.variable} ${voyageSans.variable}`,
  rootClassName: 'bg-background text-foreground font-[family-name:var(--tpl-body-font)]',
  cssVars,
}
