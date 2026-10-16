import type { Locale } from '~/lib/locale/locale-detection'

/**
 * Translations for couple-authored content.
 *
 * English is the source of truth and keeps the full shape (rows, images,
 * links). Spanish is stored beside it as an overlay of the same shape under
 * `translations.es`. At render time the overlay replaces English text field by
 * field, so anything the couple has not translated yet falls back to English.
 * Links and images always come from English: the overlay only carries words.
 */
export type Translations<T> = { es?: T }

/** Keys whose values are never translated (links and media). */
const NON_TRANSLATABLE_KEYS = new Set(['url', 'imageUrl', 'ctaUrl'])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)

const isBlank = (value: unknown): boolean => typeof value !== 'string' || value.trim() === ''

function overlayValue(base: unknown, overlay: unknown): unknown {
  if (Array.isArray(base)) {
    const overlayItems = Array.isArray(overlay) ? overlay : []
    return base.map((item, index) => overlayValue(item, overlayItems[index]))
  }
  if (isRecord(base)) {
    return overlayRecord(base, isRecord(overlay) ? overlay : {})
  }
  if (typeof base === 'string' || base === null || base === undefined) {
    return isBlank(overlay) ? base : overlay
  }
  return base
}

function overlayRecord(
  base: Record<string, unknown>,
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const keys = new Set([...Object.keys(base), ...Object.keys(overlay)])
  const result: Record<string, unknown> = {}
  for (const key of keys) {
    if (NON_TRANSLATABLE_KEYS.has(key)) {
      if (key in base) result[key] = base[key]
      continue
    }
    if (!(key in base)) {
      // A translated string for a field English left out entirely.
      if (!isBlank(overlay[key])) result[key] = overlay[key]
      continue
    }
    result[key] = overlayValue(base[key], overlay[key])
  }
  return result
}

/** Apply a translation overlay to English content, falling back to English per field. */
export function overlayTranslation<T>(base: T, overlay: unknown): T {
  return overlayValue(base, overlay) as T
}

function alignValue(base: unknown, overlay: unknown): unknown {
  if (Array.isArray(base)) {
    const overlayItems = Array.isArray(overlay) ? overlay : []
    return base.map((item, index) => alignValue(item, overlayItems[index]))
  }
  if (isRecord(base)) {
    const source = isRecord(overlay) ? overlay : {}
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(base)) {
      result[key] = NON_TRANSLATABLE_KEYS.has(key) ? value : alignValue(value, source[key])
    }
    // Keep Spanish text for optional fields English left out (never links or media).
    for (const [key, value] of Object.entries(source)) {
      if (!(key in base) && !NON_TRANSLATABLE_KEYS.has(key) && typeof value === 'string') {
        result[key] = value
      }
    }
    return result
  }
  if (typeof base === 'string') {
    return typeof overlay === 'string' ? overlay : ''
  }
  // An optional field English left empty can still be translated.
  if (base === undefined || base === null) {
    return typeof overlay === 'string' ? overlay : base
  }
  return base
}

/**
 * The translation shaped like the English content, for editing: every English
 * row has a matching row, text comes from the translation (or is blank), links
 * and images are copied from English, and Spanish text for optional fields
 * English left empty is kept, so the result validates like English.
 */
export function alignTranslation<T>(base: T, overlay: unknown): T {
  return alignValue(base, overlay) as T
}

/** Read the overlay for a locale from a stored `translations` value. English has none. */
export function readTranslation(translations: unknown, locale: Locale): unknown {
  if (locale === 'en' || !isRecord(translations)) return undefined
  return translations[locale]
}

/**
 * Keep translated rows lined up with English rows. When an edit removes one row
 * from a top-level list (rows that survive keep their identity), drop the
 * translated row at the same position.
 */
export function syncRemovedItems<T>(prev: unknown, next: unknown, translation: T): T {
  if (!isRecord(prev) || !isRecord(next) || !isRecord(translation)) return translation
  let changed = false
  const result: Record<string, unknown> = { ...translation }
  for (const [key, nextValue] of Object.entries(next)) {
    const prevValue = prev[key]
    const translated = translation[key]
    if (
      !Array.isArray(prevValue) ||
      !Array.isArray(nextValue) ||
      !Array.isArray(translated) ||
      nextValue.length !== prevValue.length - 1
    ) {
      continue
    }
    const removedAt = prevValue.findIndex((item, index) => item !== nextValue[index])
    if (removedAt === -1) continue
    result[key] = translated.filter((_, index) => index !== removedAt)
    changed = true
  }
  return changed ? (result as T) : translation
}

/** One translated string from stored translations, or undefined when absent. */
export function readTranslatedString(
  translations: unknown,
  locale: Locale,
  key: string
): string | undefined {
  const overlay = readTranslation(translations, locale)
  const value = isRecord(overlay) ? overlay[key] : undefined
  return typeof value === 'string' ? value : undefined
}

/** An event's stored Spanish text in the shape event editors send back. */
export function readEventTranslations(
  translations: unknown
): { es: { name?: string; venue?: string; attire?: string; description?: string } } | undefined {
  if (!isRecord(readTranslation(translations, 'es'))) return undefined
  const read = (key: string) => readTranslatedString(translations, 'es', key)
  return {
    es: {
      name: read('name'),
      venue: read('venue'),
      attire: read('attire'),
      description: read('description'),
    },
  }
}
