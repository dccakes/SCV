import { buildSaveTheDateCalendar, buildSaveTheDateCalendarLinks } from '~/lib/website/calendar'

// `@db.Date` columns come back from Prisma as midnight UTC, so the fixtures
// mirror that.
const utcDate = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

describe('calendar', () => {
  describe('buildSaveTheDateCalendar', () => {
    it('spans the day of the first event through the day of the last', () => {
      const calendar = buildSaveTheDateCalendar({
        title: 'Jane & John Wedding',
        events: [
          { date: utcDate('2026-09-12') }, // last
          { date: utcDate('2026-09-11') }, // first (welcome party)
        ],
      })

      // First event is the 11th → start on the 11th.
      expect(calendar?.start.toISOString()).toBe('2026-09-11T00:00:00.000Z')
      // Last event is the 12th → inclusive last day is the 12th → exclusive end is the 13th.
      expect(calendar?.endExclusive.toISOString()).toBe('2026-09-13T00:00:00.000Z')
    })

    it('handles a single dated event', () => {
      const calendar = buildSaveTheDateCalendar({
        title: 'Jane & John Wedding',
        events: [{ date: utcDate('2026-09-12') }],
      })

      expect(calendar?.start.toISOString()).toBe('2026-09-12T00:00:00.000Z')
      expect(calendar?.endExclusive.toISOString()).toBe('2026-09-13T00:00:00.000Z')
    })

    it('ignores events without a date', () => {
      const calendar = buildSaveTheDateCalendar({
        title: 'Jane & John Wedding',
        events: [{ date: null }, { date: utcDate('2026-09-12') }, { date: null }],
      })

      expect(calendar?.start.toISOString()).toBe('2026-09-12T00:00:00.000Z')
      expect(calendar?.endExclusive.toISOString()).toBe('2026-09-13T00:00:00.000Z')
    })

    it('returns null when no event has a date', () => {
      const calendar = buildSaveTheDateCalendar({
        title: 'Jane & John Wedding',
        events: [{ date: null }],
      })

      expect(calendar).toBeNull()
    })
  })

  describe('buildSaveTheDateCalendarLinks', () => {
    const stamp = new Date('2026-06-25T12:00:00.000Z')

    const links = buildSaveTheDateCalendarLinks(
      {
        title: 'Jane & John Wedding',
        description: 'Save the date!',
        location: 'The Grand Hall',
        events: [{ date: utcDate('2026-09-12') }, { date: utcDate('2026-09-11') }],
      },
      stamp
    )

    it('returns null when there is nothing to save', () => {
      expect(buildSaveTheDateCalendarLinks({ title: 'x', events: [] })).toBeNull()
    })

    it('builds an all-day Google Calendar link', () => {
      expect(links?.googleUrl).toContain('action=TEMPLATE')
      expect(links?.googleUrl).toContain('dates=20260911%2F20260913')
      expect(links?.googleUrl).toContain('text=Jane+%26+John+Wedding')
      expect(links?.googleUrl).toContain('location=The+Grand+Hall')
    })

    it('builds an all-day Outlook link', () => {
      expect(links?.outlookUrl).toContain('rru=addevent')
      expect(links?.outlookUrl).toContain('allday=true')
      expect(links?.outlookUrl).toContain('startdt=2026-09-11')
      expect(links?.outlookUrl).toContain('enddt=2026-09-13')
    })

    it('builds an all-day .ics file', () => {
      expect(links?.fileName).toBe('save-the-date.ics')
      expect(links?.ics).toContain('BEGIN:VEVENT')
      expect(links?.ics).toContain('DTSTART;VALUE=DATE:20260911')
      expect(links?.ics).toContain('DTEND;VALUE=DATE:20260913')
      expect(links?.ics).toContain('SUMMARY:Jane & John Wedding')
      expect(links?.ics).toContain('LOCATION:The Grand Hall')
      expect(links?.ics).toContain('DTSTAMP:20260625T120000Z')
      // CRLF line endings per RFC 5545.
      expect(links?.ics).toContain('\r\n')
    })
  })
})
