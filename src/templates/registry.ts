/**
 * Wedding Template Registry
 *
 * The single place where template plugins (with their React components) are
 * registered. Adding a new template means building it under
 * `src/templates/<id>/`, adding its metadata to `catalog.ts`, and adding the
 * module here — nothing else in the app needs to change.
 *
 * Pure metadata (ids, names, swatches) lives in `catalog.ts` so the server and
 * client can validate/list templates without pulling in React or fonts. This
 * module owns runtime resolution to the actual components.
 */

import { aureliaTemplate } from '~/templates/aurelia'
import { DEFAULT_TEMPLATE_ID } from '~/templates/catalog'
import { classicTemplate } from '~/templates/classic'
import type { WeddingTemplate } from '~/templates/types'

/** All registered template plugins, in display order. */
export const TEMPLATES: readonly WeddingTemplate[] = [classicTemplate, aureliaTemplate]

const TEMPLATES_BY_ID: ReadonlyMap<string, WeddingTemplate> = new Map(
  TEMPLATES.map((template) => [template.id, template])
)

/**
 * Resolve a template by id, falling back to the default template when the id is
 * null/undefined or not registered.
 */
export function resolveTemplate(templateId: string | null | undefined): WeddingTemplate {
  if (templateId) {
    const match = TEMPLATES_BY_ID.get(templateId)
    if (match) {
      return match
    }
  }

  const fallback = TEMPLATES_BY_ID.get(DEFAULT_TEMPLATE_ID)
  if (!fallback) {
    // The default must always be registered; this guards against misconfig.
    throw new Error(`Default wedding template "${DEFAULT_TEMPLATE_ID}" is not registered`)
  }
  return fallback
}
