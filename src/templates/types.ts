/**
 * Wedding Template Plugin — Types
 *
 * A wedding template is a self-contained plugin that styles every guest-facing
 * surface (the website home page, the minimal fallback page, save the date,
 * invitation, and the RSVP flow) into one coherent look.
 *
 * Templates stay decoupled from the rest of the app by speaking a single
 * contract: they read `WeddingPageData` and render React components, and they
 * expose a `theme` whose CSS-variable overrides cascade to every surface —
 * including pre-existing components like the RSVP form — so colours and fonts
 * stay consistent without each surface needing template-specific code.
 */

import type { ComponentType, CSSProperties } from 'react'
import type { TemplateMeta } from '~/templates/catalog'
import type { WeddingPageData } from '~/server/domains/website/website.types'

/**
 * Props shared by the rich, content-bearing surfaces (home, save the date,
 * invitation). These render directly from the couple's wedding data.
 */
export type TemplateSurfaceProps = {
  weddingData: WeddingPageData
  /** Base public path for the website, e.g. `/w/janeandjohn`. */
  path: string
  /** Optional intro copy from the HOME website section. */
  introText?: string
}

/**
 * Props for the minimal fallback page shown when the website builder plugin is
 * disabled. It intentionally renders only names + an optional RSVP link.
 */
export type TemplateMinimalProps = {
  coupleNames: string
  isRsvpEnabled: boolean
  path: string
}

/**
 * A template's visual identity. The CSS variables override the app's design
 * tokens (`--primary`, `--background`, fonts, …) on the template root, so every
 * descendant surface — bespoke or shared — adopts the template palette.
 */
export type TemplateTheme = {
  /**
   * className(s) that define the template's font CSS variables. These come from
   * next/font `.variable` outputs (see `src/templates/fonts.ts`).
   */
  fontClassName: string
  /** Utility classes applied to the template root (base font family, etc.). */
  rootClassName?: string
  /** CSS custom properties merged onto the template root element. */
  cssVars: CSSProperties
}

/**
 * The components a template must provide for each guest-facing surface.
 */
export type TemplateComponents = {
  Home: ComponentType<TemplateSurfaceProps>
  HomeMobile: ComponentType<TemplateSurfaceProps>
  Minimal: ComponentType<TemplateMinimalProps>
  SaveTheDate: ComponentType<TemplateSurfaceProps>
  Invitation: ComponentType<TemplateSurfaceProps>
}

/**
 * A registered wedding template plugin: its catalog metadata plus the visual
 * theme and the React components for each surface.
 */
export type WeddingTemplate = TemplateMeta & {
  theme: TemplateTheme
  components: TemplateComponents
}
