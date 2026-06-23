/**
 * Wedding Template Plugin System — public surface.
 */

export {
  type TemplateMeta,
  DEFAULT_TEMPLATE_ID,
  isKnownTemplateId,
  listTemplateSummaries,
  TEMPLATE_CATALOG,
  TEMPLATE_IDS,
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
