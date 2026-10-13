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
