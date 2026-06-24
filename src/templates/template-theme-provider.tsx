/**
 * TemplateThemeProvider
 *
 * Wraps any guest-facing surface in a template's visual identity. It attaches
 * the template's font-variable classNames and merges its CSS-variable overrides
 * onto a root element. Because the app's design tokens (`--primary`,
 * `--background`, fonts, …) are plain CSS variables consumed by Tailwind,
 * overriding them here cascades to every descendant — bespoke template surfaces
 * AND shared components like the RSVP form — keeping the whole flow coherent.
 */

import type { ReactNode } from 'react'
import type { WeddingTemplate } from '~/templates/types'

type TemplateThemeProviderProps = {
  template: WeddingTemplate
  children: ReactNode
  /** Optional extra classes for the root (e.g. layout/min-height). */
  className?: string
}

export function TemplateThemeProvider({
  template,
  children,
  className,
}: Readonly<TemplateThemeProviderProps>) {
  const { theme } = template

  return (
    <div
      data-wedding-template={template.id}
      className={[theme.fontClassName, theme.rootClassName, 'min-h-screen', className]
        .filter(Boolean)
        .join(' ')}
      style={theme.cssVars}
    >
      {children}
    </div>
  )
}
