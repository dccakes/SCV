import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'

import { Button } from '~/components/ui/button'
import { AddToCalendarButtons } from '~/components/website/add-to-calendar-buttons'
import { InvalidHouseholdInvite } from '~/components/website/household-invite/invalid-household-invite'
import { buildSaveTheDateCalendarLinks } from '~/lib/website/calendar'
import { householdInviteService } from '~/server/application/household-invite'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

type HouseholdInvitePageProps = {
  params: Promise<{
    websiteSubUrl: string
  }>
  searchParams?: Promise<{
    invalid?: string
    updated?: string
  }>
}

const getCookieName = (websiteSubUrl: string) => `household_invite_${websiteSubUrl}`

const formatGuestName = (guest: { firstName: string; lastName: string }) =>
  [guest.firstName, guest.lastName].filter(Boolean).join(' ')

// Event dates come from a `@db.Date` column (midnight UTC), so format in UTC to
// show the day the couple entered regardless of the viewer's timezone.
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

/** Display the event span as a single day or an inclusive date range. */
const formatEventDateRange = (first: Date, last: Date) =>
  first.getTime() === last.getTime()
    ? dateFormatter.format(first)
    : `${dateFormatter.format(first)} – ${dateFormatter.format(last)}`

export default async function HouseholdInvitePage({
  params,
  searchParams,
}: HouseholdInvitePageProps) {
  const { websiteSubUrl } = await params
  const resolvedSearchParams = await searchParams
  const cookieStore = await cookies()
  const token = cookieStore.get(getCookieName(websiteSubUrl))?.value
  const inviteData = await householdInviteService.getInviteData(websiteSubUrl, token)

  if (!inviteData) return <InvalidHouseholdInvite websiteSubUrl={websiteSubUrl} />

  const coupleNames = `${inviteData.wedding.groomFirstName} & ${inviteData.wedding.brideFirstName}`

  // Everything below is inherited from the wedding's events — no hardcoded copy.
  const datedEvents = inviteData.events
    .filter((event): event is typeof event & { date: Date } => event.date != null)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
  const formattedDate = datedEvents.length
    ? formatEventDateRange(datedEvents[0].date, datedEvents[datedEvents.length - 1].date)
    : null
  const location = datedEvents.find((event) => event.venue)?.venue ?? null

  const calendarLinks = buildSaveTheDateCalendarLinks({
    title: `${coupleNames} Wedding`,
    description: `Save the date for the wedding of ${coupleNames}! Formal invitation to follow.`,
    location: location ?? undefined,
    events: inviteData.events,
  })

  return (
    <main className='min-h-screen bg-background px-5 py-10 text-foreground'>
      <section className='mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl flex-col justify-center'>
        {resolvedSearchParams?.updated === '1' && (
          <p className='mb-8 border border-success/30 bg-success/10 px-4 py-3 font-mono text-success text-xs uppercase tracking-wider'>
            Your details were updated.
          </p>
        )}

        <p className='mb-5 font-mono text-muted-foreground text-xs uppercase tracking-[0.28em]'>
          Save the date
        </p>
        <h1 className='font-display text-6xl italic leading-none md:text-8xl'>{coupleNames}</h1>

        <div className='mt-10 grid gap-6 border-border border-y py-8 md:grid-cols-2'>
          <div>
            <p className='font-mono text-muted-foreground text-xs uppercase tracking-[0.22em]'>
              Date
            </p>
            <p className='mt-2 font-serif text-2xl'>{formattedDate ?? 'To be announced'}</p>
          </div>
          <div>
            <p className='font-mono text-muted-foreground text-xs uppercase tracking-[0.22em]'>
              Location
            </p>
            <p className='mt-2 font-serif text-2xl'>{location ?? 'To be announced'}</p>
          </div>
        </div>

        {calendarLinks ? (
          <div className='mt-8'>
            <p className='mb-3 font-mono text-muted-foreground text-xs uppercase tracking-[0.22em]'>
              Add to your calendar
            </p>
            <div className='flex justify-start'>
              <AddToCalendarButtons {...calendarLinks} />
            </div>
          </div>
        ) : null}

        <div className='mt-8'>
          <p className='font-mono text-muted-foreground text-xs uppercase tracking-[0.22em]'>
            Invited household
          </p>
          <ul className='mt-3 space-y-2 font-serif text-xl'>
            {inviteData.guests.map((guest) => (
              <li key={guest.id}>{formatGuestName(guest)}</li>
            ))}
          </ul>
        </div>

        <p className='mt-8 max-w-xl font-sans text-muted-foreground leading-7'>
          Formal invitation details will follow. For now, please make sure we have the correct names
          and mailing address for your household.
        </p>

        <div className='mt-10'>
          <Button asChild>
            <Link href={`/${websiteSubUrl}/invite/update`}>Update our details</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
