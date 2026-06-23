import type { CSSProperties } from 'react'
import { classicSerif } from '~/templates/fonts'
import type { TemplateTheme } from '~/templates/types'

/**
 * Classic theme — the original OSWP look: warm cream backdrop, editorial serif,
 * soft zinc ink, and a blush/coral accent. Colour values mirror the app's
 * default design tokens so the template stays self-contained even if global
 * defaults change later.
 */
const cssVars: CSSProperties = {
  '--background': '0.9856 0.0084 56.32',
  '--foreground': '0.3353 0.0132 2.77',
  '--primary': '0.7357 0.1641 34.71',
  '--primary-foreground': '1 0 0',
  '--muted-foreground': '0.5534 0.0116 58.07',
  '--border': '0.9296 0.037 38.69',
  '--tpl-heading-font': 'var(--tpl-classic-serif)',
  '--tpl-body-font': 'var(--tpl-classic-serif)',
} as CSSProperties

export const classicTheme: TemplateTheme = {
  fontClassName: classicSerif.variable,
  rootClassName: 'bg-background font-[family-name:var(--tpl-body-font)]',
  cssVars,
}
