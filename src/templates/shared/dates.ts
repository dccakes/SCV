import { useLocale } from 'next-intl'
import { formatEventTime, formatLongDate, toIntlLocale } from '~/lib/locale/intl-format'
import type { WeddingDate } from '~/server/domains/website/website.types'

/**
 * The wedding date's numeric form (`MM.DD.YYYY`) is locale-independent, so it
 * is the stable source we re-parse to format in the visitor's locale. Returns a UTC-midnight date, or undefined when it can't be parsed.
 */
function parseNumericDate(value: string | undefined): Date | undefined {
  const match = value?.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (!match) {
    return undefined
  }
  const [, month, day, year] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  return Number.isNaN(date.getTime()) ? undefined : date
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Locale-aware date formatting for template surfaces. Event dates come from a
 * `@db.Date` column (midnight UTC), so every calendar day is read in UTC.
 */
export function useTemplateDates() {
  const appLocale = useLocale()
  const locale = toIntlLocale(appLocale)

  /** e.g. "Saturday, May 30, 2027" / "sábado, 30 de mayo de 2027". */
  const weddingDate = (date: WeddingDate | undefined): string | undefined => {
    const parsed = parseNumericDate(date?.numberFormat)
    if (!parsed) {
      return date?.standardFormat
    }
    return parsed.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: locale === 'es-MX' ? 'long' : 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
  }

  /** e.g. "05.30.2027" / "30.05.2027". */
  const weddingDateNumeric = (date: WeddingDate | undefined): string | undefined => {
    const parsed = parseNumericDate(date?.numberFormat)
    if (!parsed) {
      return date?.numberFormat
    }
    const day = pad(parsed.getUTCDate())
    const month = pad(parsed.getUTCMonth() + 1)
    const year = parsed.getUTCFullYear()
    return locale === 'es-MX' ? `${day}.${month}.${year}` : `${month}.${day}.${year}`
  }

  /** e.g. "May 30, 2027" / "30 de mayo de 2027". */
  const eventDate = (date: Date | null | undefined): string | undefined => {
    if (!date) {
      return undefined
    }
    return formatLongDate(date, appLocale)
  }

  /** Event start/end time in the visitor's convention (24-hour for Spanish). */
  const eventTime = (time: string): string => formatEventTime(time, appLocale)

  return { weddingDate, weddingDateNumeric, eventDate, eventTime }
}
