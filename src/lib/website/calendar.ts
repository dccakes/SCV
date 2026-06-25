/**
 * Save the Date — calendar export helpers.
 *
 * Builds an all-day calendar block spanning the couple's wedding weekend: from
 * the day of their first event through the day of their last event. The same
 * block is offered three ways — a Google Calendar link, an Outlook link, and a
 * downloadable `.ics` file (Apple Calendar and most other clients) — so a guest
 * can save the dates straight from the Save the Date page.
 *
 * Event dates come from a `@db.Date` column, which Prisma returns as midnight
 * UTC. We therefore read every calendar day in UTC so the exported dates match
 * what the couple entered, regardless of the viewer's timezone.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000

type EventLike = {
  date: Date | null
}

export type SaveTheDateCalendar = {
  title: string
  description?: string
  location?: string
  /** Inclusive first all-day date to block out (the day of the first event). */
  start: Date
  /** Exclusive end date (the day after the last event). */
  endExclusive: Date
}

export type SaveTheDateCalendarLinks = {
  googleUrl: string
  outlookUrl: string
  /** Raw `.ics` file contents, ready to download. */
  ics: string
  fileName: string
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY)
}

/** `YYYYMMDD` in UTC, used by Google Calendar and `.ics` all-day values. */
function toCompactDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/** `YYYY-MM-DD` in UTC, used by the Outlook all-day deep link. */
function toIsoDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** `YYYYMMDDTHHMMSSZ` UTC timestamp, used by the `.ics` `DTSTAMP` field. */
function toIcsTimestamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
}

/** Escape a value for an `.ics` text field (RFC 5545). */
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Build the calendar block for a couple's events, or `null` when no event has a
 * date yet (nothing to save).
 */
export function buildSaveTheDateCalendar(input: {
  title: string
  description?: string
  location?: string
  events: ReadonlyArray<EventLike>
}): SaveTheDateCalendar | null {
  const times = input.events
    .map((event) => event.date?.getTime())
    .filter((time): time is number => time != null)
  if (times.length === 0) return null

  const firstEvent = new Date(Math.min(...times))
  const lastEvent = new Date(Math.max(...times))

  return {
    title: input.title,
    description: input.description,
    location: input.location,
    // The day of the first event …
    start: firstEvent,
    // … through the day of the last event. The end is exclusive, so the
    // inclusive last day (lastEvent) becomes lastEvent + 1 here.
    endExclusive: addUtcDays(lastEvent, 1),
  }
}

function buildGoogleCalendarUrl(calendar: SaveTheDateCalendar): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: calendar.title,
    dates: `${toCompactDate(calendar.start)}/${toCompactDate(calendar.endExclusive)}`,
  })
  if (calendar.description) params.set('details', calendar.description)
  if (calendar.location) params.set('location', calendar.location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function buildOutlookCalendarUrl(calendar: SaveTheDateCalendar): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: calendar.title,
    startdt: toIsoDate(calendar.start),
    enddt: toIsoDate(calendar.endExclusive),
    allday: 'true',
  })
  if (calendar.description) params.set('body', calendar.description)
  if (calendar.location) params.set('location', calendar.location)
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

function buildIcs(calendar: SaveTheDateCalendar, stamp: Date): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SCV//Save the Date//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:save-the-date-${toCompactDate(calendar.start)}-${toCompactDate(calendar.endExclusive)}@scv`,
    `DTSTAMP:${toIcsTimestamp(stamp)}`,
    `DTSTART;VALUE=DATE:${toCompactDate(calendar.start)}`,
    `DTEND;VALUE=DATE:${toCompactDate(calendar.endExclusive)}`,
    `SUMMARY:${escapeIcsText(calendar.title)}`,
  ]
  if (calendar.description) lines.push(`DESCRIPTION:${escapeIcsText(calendar.description)}`)
  if (calendar.location) lines.push(`LOCATION:${escapeIcsText(calendar.location)}`)
  lines.push('TRANSP:TRANSPARENT', 'END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}

/**
 * Build the three ready-to-use calendar artifacts (Google link, Outlook link,
 * `.ics` contents) for the couple's events, or `null` when there is no dated
 * event to save.
 */
export function buildSaveTheDateCalendarLinks(
  input: {
    title: string
    description?: string
    location?: string
    events: ReadonlyArray<EventLike>
  },
  stamp: Date = new Date()
): SaveTheDateCalendarLinks | null {
  const calendar = buildSaveTheDateCalendar(input)
  if (!calendar) return null

  return {
    googleUrl: buildGoogleCalendarUrl(calendar),
    outlookUrl: buildOutlookCalendarUrl(calendar),
    ics: buildIcs(calendar, stamp),
    fileName: 'save-the-date.ics',
  }
}
