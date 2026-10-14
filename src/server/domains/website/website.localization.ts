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

/**
 * Overlay translated text onto the named fields only, so a stored translation
 * can never touch ids, dates or other non-text data.
 */
function localizeFields<T extends WithTranslations, K extends keyof T>(
  entity: T,
  keys: readonly K[],
  locale: Locale
): Omit<T, 'translations'> {
  const overlay = readTranslation(entity.translations, locale) as
    | Record<string, unknown>
    | undefined
  const localized = Object.fromEntries(
    keys
      .filter((key) => key in entity)
      .map((key) => [key, overlayTranslation(entity[key], overlay?.[key as string])])
  )
  return { ...withoutTranslations(entity), ...localized }
}

type LocalizableOption = WithTranslations & { text: string; description: string }
type LocalizableQuestion = WithTranslations & { text: string; options?: LocalizableOption[] }

/** Localize a question (and its options) and drop stored translations. */
export function localizeQuestion<T extends LocalizableQuestion>(
  question: T,
  locale: Locale
): Omit<T, 'translations'> {
  return {
    ...localizeFields(question, ['text'], locale),
    ...(question.options
      ? {
          options: question.options.map((option) =>
            localizeFields(option, ['text', 'description'], locale)
          ),
        }
      : {}),
  }
}

type LocalizableEvent = WithTranslations & {
  name: string
  venue: string | null
  attire?: string | null
  description?: string | null
  questions?: LocalizableQuestion[]
}

/** Localize an event's guest-facing text and its RSVP questions. */
export function localizeEvent<T extends LocalizableEvent>(
  event: T,
  locale: Locale
): Omit<T, 'translations'> {
  return {
    ...localizeFields(event, ['name', 'venue', 'attire', 'description'], locale),
    ...(event.questions
      ? { questions: event.questions.map((question) => localizeQuestion(question, locale)) }
      : {}),
  }
}
