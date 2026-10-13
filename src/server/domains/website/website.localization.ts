/**
 * Website Domain - Localization
 *
 * Applies couple-authored translations to the public wedding page data so
 * templates receive plain, already-localized content. English stays the source
 * of truth: any field without a translation falls back to English, and the raw
 * `translations` payloads are stripped so they never reach the browser.
 */

import { overlayTranslation, readTranslation } from '~/lib/i18n/translations'
import type { Locale } from '~/lib/locale/locale-detection'

type WithTranslations = { translations?: unknown }

function withoutTranslations<T extends WithTranslations>(entity: T): Omit<T, 'translations'> {
  const { translations: _translations, ...rest } = entity
  return rest
}

/** Localize one section's content and drop its stored translations. */
export function localizeSection<T extends WithTranslations & { content: unknown }>(
  section: T,
  locale: Locale
): Omit<T, 'translations'> {
  return {
    ...withoutTranslations(section),
    content: overlayTranslation(section.content, readTranslation(section.translations, locale)),
  }
}

type LocalizableOption = WithTranslations & { text: string; description: string }
type LocalizableQuestion = WithTranslations & { text: string; options?: LocalizableOption[] }

/** Localize a question (and its options) and drop stored translations. */
export function localizeQuestion<T extends LocalizableQuestion>(
  question: T,
  locale: Locale
): Omit<T, 'translations'> {
  const overlay = readTranslation(question.translations, locale) as { text?: unknown } | undefined
  const base = withoutTranslations(question)
  return {
    ...base,
    text: overlayTranslation(question.text, overlay?.text),
    ...(question.options
      ? {
          options: question.options.map((option) => {
            const optionOverlay = readTranslation(option.translations, locale) as
              | { text?: unknown; description?: unknown }
              | undefined
            return {
              ...withoutTranslations(option),
              text: overlayTranslation(option.text, optionOverlay?.text),
              description: overlayTranslation(option.description, optionOverlay?.description),
            }
          }),
        }
      : {}),
  }
}

type LocalizableEvent = WithTranslations & {
  name: string
  venue: string | null
  attire: string | null
  description: string | null
  questions?: LocalizableQuestion[]
}

/** Localize an event's guest-facing text and its RSVP questions. */
export function localizeEvent<T extends LocalizableEvent>(
  event: T,
  locale: Locale
): Omit<T, 'translations'> {
  const overlay = readTranslation(event.translations, locale)
  const text = overlayTranslation(
    { name: event.name, venue: event.venue, attire: event.attire, description: event.description },
    overlay
  )
  return {
    ...withoutTranslations(event),
    ...text,
    ...(event.questions
      ? { questions: event.questions.map((question) => localizeQuestion(question, locale)) }
      : {}),
  }
}

/** BCP 47 tag used for dates on the guest site. */
export function dateLocaleFor(locale: Locale): string {
  return locale === 'es' ? 'es-MX' : 'en-US'
}
