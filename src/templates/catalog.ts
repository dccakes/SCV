/**
 * Wedding Template Catalog
 *
 * Pure, serialisable metadata for every template plugin — no React components
 * and no font imports. This module is safe to import from anywhere: server
 * services that validate `templateId`, client components that render the
 * picker, and the runtime registry that attaches the actual components.
 *
 * Each template module builds its full definition by spreading its meta from
 * here, so this stays the single source of truth for ids and copy.
 */

export type TemplateMeta = {
  id: string
  name: string
  description: string
  /** Representative colours (CSS values) for the picker preview. */
  swatches: string[]
}

export const CLASSIC_TEMPLATE_ID = 'classic'
export const AURELIA_TEMPLATE_ID = 'aurelia'
export const VOYAGE_TEMPLATE_ID = 'voyage'

export const classicMeta: TemplateMeta = {
  id: CLASSIC_TEMPLATE_ID,
  name: 'Classic',
  description: 'Warm cream and blush with a timeless editorial serif.',
  swatches: ['#f6efe6', '#d98a6a', '#52525b'],
}

export const aureliaMeta: TemplateMeta = {
  id: AURELIA_TEMPLATE_ID,
  name: 'Aurelia',
  description: 'Elegant and modern — pale lavender, violet, and cool blue.',
  swatches: ['#ece7fb', '#6d4bd1', '#3f6fd1'],
}

export const voyageMeta: TemplateMeta = {
  id: VOYAGE_TEMPLATE_ID,
  name: 'Voyage',
  description:
    'A luxury destination-wedding editorial — warm ivory, soft black, and champagne gold.',
  swatches: ['#f7f3ea', '#b89455', '#11110f'],
}

/** All template metadata, in display order. */
export const TEMPLATE_CATALOG: readonly TemplateMeta[] = [classicMeta, aureliaMeta, voyageMeta]

/** The template used when a website has no `templateId` (or an unknown one). */
export const DEFAULT_TEMPLATE_ID = CLASSIC_TEMPLATE_ID

/** All registered template ids. */
export const TEMPLATE_IDS: readonly string[] = TEMPLATE_CATALOG.map((template) => template.id)

const TEMPLATE_ID_SET = new Set(TEMPLATE_IDS)

/** True when the id maps to a known template. */
export function isKnownTemplateId(templateId: string | null | undefined): boolean {
  return Boolean(templateId && TEMPLATE_ID_SET.has(templateId))
}

/** Serialisable summaries for client components (e.g. the picker). */
export function listTemplateSummaries(): TemplateMeta[] {
  return TEMPLATE_CATALOG.map((template) => ({ ...template }))
}
