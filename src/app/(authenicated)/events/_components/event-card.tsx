'use client'

import { format } from 'date-fns'
import { Calendar, MapPin } from 'lucide-react'
import { memo } from 'react'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import type { EventWithStats } from '~/server/domains/event/event.types'

type EventCardProps = Readonly<{
  event: EventWithStats
  onEdit: (eventId: string) => void
  onDelete: (eventId: string) => void
}>

function EventCardBase({ event, onEdit, onDelete }: EventCardProps) {
  const { guestResponses } = event
  const totalGuests =
    guestResponses.attending +
    guestResponses.invited +
    guestResponses.declined +
    guestResponses.notInvited
  const totalInvited = guestResponses.attending + guestResponses.invited + guestResponses.declined

  return (
    <Card className='transition-shadow hover:shadow-md'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0 flex-1'>
            <CardTitle className='text-lg md:text-xl'>{event.name}</CardTitle>
            {event.date && (
              <CardDescription className='mt-1.5 flex items-center gap-1.5'>
                <Calendar className='h-3.5 w-3.5 shrink-0' />
                <span className='text-xs md:text-sm'>{format(new Date(event.date), 'PPP')}</span>
              </CardDescription>
            )}
          </div>
          {event.collectRsvp && (
            <Badge variant='secondary' className='shrink-0 text-xs'>
              RSVPs
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='space-y-2.5'>
          {event.venue && (
            <div className='flex items-start gap-2 text-sm'>
              <MapPin className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
              <span className='text-muted-foreground text-xs md:text-sm'>{event.venue}</span>
            </div>
          )}

          {event.startTime && event.endTime && (
            <div className='text-muted-foreground text-xs md:text-sm'>
              {event.startTime} - {event.endTime}
            </div>
          )}

          {event.description && (
            <p className='line-clamp-2 text-muted-foreground text-xs md:text-sm'>
              {event.description}
            </p>
          )}

          {event.collectRsvp && totalGuests > 0 && (
            <div className='rounded-md border bg-muted/50 p-2'>
              <div className='font-medium text-muted-foreground text-xs'>
                RSVP Status {totalInvited > 0 && `(${totalInvited} invited)`}
              </div>
              <div className='mt-1.5 flex gap-3 text-xs'>
                <div className='flex items-center gap-1'>
                  <div className='h-2 w-2 rounded-full bg-green-500' />
                  <span className='font-medium'>{guestResponses.attending}</span>
                  <span className='text-muted-foreground'>Attending</span>
                </div>
                <div className='flex items-center gap-1'>
                  <div className='h-2 w-2 rounded-full bg-yellow-500' />
                  <span className='font-medium'>{guestResponses.invited}</span>
                  <span className='text-muted-foreground'>Pending</span>
                </div>
                <div className='flex items-center gap-1'>
                  <div className='h-2 w-2 rounded-full bg-red-500' />
                  <span className='font-medium'>{guestResponses.declined}</span>
                  <span className='text-muted-foreground'>Declined</span>
                </div>
              </div>
              {totalInvited > 0 && (
                <div className='mt-1.5 flex items-center gap-1 border-t border-border/50 pt-1.5 text-xs'>
                  <div className='h-2 w-2 rounded-full bg-blue-500' />
                  <span className='font-medium'>~{event.estimatedAttendance}</span>
                  <span className='text-muted-foreground'>
                    of {totalInvited} estimated to attend
                  </span>
                </div>
              )}
            </div>
          )}

          <div className='flex gap-2 pt-2'>
            <Button
              variant='ghost'
              size='sm'
              className='text-xs md:text-sm'
              onClick={() => onEdit(event.id)}
            >
              Edit
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='text-red-600 text-xs hover:text-red-700 md:text-sm'
              onClick={() => onDelete(event.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const EventCard = memo(EventCardBase)
