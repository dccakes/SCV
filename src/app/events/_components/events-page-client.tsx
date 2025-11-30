'use client'

/**
 * Events Page Client Component
 *
 * Displays list of events for the wedding.
 * Client component to enable interactivity (future: create/edit/delete).
 */

import { format } from 'date-fns'
import { Calendar, MapPin } from 'lucide-react'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { type Event } from '~/server/domains/event/event.types'

type EventsPageClientProps = Readonly<{
  events: Event[]
}>

export function EventsPageClient({ events }: EventsPageClientProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center md:py-12">
          <div className="mb-4 rounded-full bg-muted p-4 md:p-6">
            <Calendar className="h-10 w-10 text-muted-foreground md:h-12 md:w-12" />
          </div>
          <h2 className="mb-2 text-xl font-semibold md:text-2xl">No events yet</h2>
          <p className="mb-6 max-w-md px-4 text-sm text-muted-foreground md:text-base">
            Get started by creating your first wedding event. You can add ceremonies, receptions,
            rehearsal dinners, and more.
          </p>
          <Button>Create Event</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}

type EventCardProps = Readonly<{
  event: Event
}>

function EventCard({ event }: EventCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg md:text-xl">{event.name}</CardTitle>
            {event.date && (
              <CardDescription className="mt-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs md:text-sm">{format(new Date(event.date), 'PPP')}</span>
              </CardDescription>
            )}
          </div>
          {event.collectRsvp && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              RSVPs
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2.5">
          {event.venue && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground md:text-sm">{event.venue}</span>
            </div>
          )}

          {event.startTime && event.endTime && (
            <div className="text-xs text-muted-foreground md:text-sm">
              {event.startTime} - {event.endTime}
            </div>
          )}

          {event.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground md:text-sm">
              {event.description}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 text-xs md:text-sm">
              View Details
            </Button>
            <Button variant="ghost" size="sm" className="text-xs md:text-sm">
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
