/** Map the app locale (`en` | `es`) to the BCP 47 tag used for date formatting. */
export function toIntlLocale(locale: string): 'es-MX' | 'en-US' {
  return locale === 'es' ? 'es-MX' : 'en-US'
}

/**
 * Format a calendar day as "May 30, 2027" / "30 de mayo de 2027". Event dates
 * come from a `@db.Date` column (midnight UTC), so the day is read in UTC to
 * show the day the couple entered regardless of the viewer's timezone.
 */
export function formatLongDate(date: Date | string, locale: string): string {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date))
}

const TIME_PATTERN = /^(\d{1,2}):(\d{2})\s*(?:([ap])\.?\s*m\.?)?$/i

/**
 * Show an event time in the visitor's convention. Times are stored as typed
 * (usually "15:30" from a time input, sometimes "5:00 PM"). English keeps the
 * couple's text; Spanish uses the 24-hour clock common on Mexican invitations.
 * Anything that is not a recognisable time is returned unchanged.
 */
export function formatEventTime(value: string, locale: string): string {
  if (locale !== 'es') return value
  const match = TIME_PATTERN.exec(value.trim())
  if (!match) return value
  const [, rawHour = '0', minute = '00', meridiem] = match
  let hour = Number(rawHour)
  if (meridiem) {
    const isPm = meridiem.toLowerCase() === 'p'
    hour = (hour % 12) + (isPm ? 12 : 0)
  }
  if (hour > 23 || Number(minute) > 59) return value
  return `${String(hour).padStart(2, '0')}:${minute}`
}
