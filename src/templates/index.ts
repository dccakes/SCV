/**
 * Wedding Template Plugin System — public surface.
 */

export {
  DEFAULT_TEMPLATE_ID,
  isKnownTemplateId,
  listTemplateSummaries,
  TEMPLATE_CATALOG,
  TEMPLATE_IDS,
  type TemplateMeta,
} from '~/templates/catalog'
export { resolveTemplate, TEMPLATES } from '~/templates/registry'
export { TemplateThemeProvider } from '~/templates/template-theme-provider'
export type {
  TemplateComponents,
  TemplateMinimalProps,
  TemplateSurfaceProps,
  TemplateTheme,
  WeddingTemplate,
} from '~/templates/types'
