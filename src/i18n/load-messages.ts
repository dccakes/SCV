import type { Locale } from '~/lib/locale/locale-detection'

/**
 * Messages are split by area so each surface owns its own file:
 * - `<locale>.json`: shared guest flows (RSVP, invites, join)
 * - `<locale>/site.json`: shared wedding-site chrome (password page, welcome, toggle)
 * - `<locale>/voyage.json`: the Voyage template
 * - `<locale>/templates.json`: the Classic and Aurelia templates
 * Each file holds distinct top-level namespaces, so a shallow merge is safe.
 */
export async function loadMessages(locale: Locale): Promise<Record<string, unknown>> {
  const [core, site, voyage, templates] = await Promise.all([
    import(`./messages/${locale}.json`),
    import(`./messages/${locale}/site.json`),
    import(`./messages/${locale}/voyage.json`),
    import(`./messages/${locale}/templates.json`),
  ])
  return { ...core.default, ...site.default, ...voyage.default, ...templates.default }
}
