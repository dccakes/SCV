'use client'

import { format } from 'date-fns'
import { Calendar, MapPin, MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react'
import { memo } from 'react'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Switch } from '~/components/ui/switch'
import type { EventWithStats } from '~/server/domains/event/event.types'

type EventCardProps = Readonly<{
  event: EventWithStats
  onEdit: (eventId: string) => void
  onDelete: (eventId: string) => void
  onManageGuests: (eventId: string) => void
  onToggleCollectRsvp: (eventId: string, collectRsvp: boolean) => void
  isTogglingCollectRsvp?: boolean
}>

function EventCardBase({
  event,
  onEdit,
  onDelete,
  onManageGuests,
  onToggleCollectRsvp,
  isTogglingCollectRsvp = false,
}: EventCardProps) {
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
          <div className='flex items-center gap-2'>
            {event.collectRsvp && (
              <Badge variant='secondary' className='shrink-0 text-xs'>
                RSVPs
              </Badge>
            )}
            <div className='flex items-center gap-2'>
              <label
                htmlFor={`${event.id}-collect-rsvp-toggle`}
                className='font-mono text-[0.6rem] text-muted-foreground uppercase tracking-widest'
              >
                Collect RSVPs
              </label>
              <Switch
                id={`${event.id}-collect-rsvp-toggle`}
                aria-label={`Toggle RSVP collection for ${event.name}`}
                checked={event.collectRsvp}
                onCheckedChange={(checked) => onToggleCollectRsvp(event.id, checked)}
                disabled={isTogglingCollectRsvp}
              />
            </div>
          </div>
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

          {totalGuests > 0 && (
            <div className='rounded-md border bg-muted/50 p-2'>
              <div className='font-medium text-muted-foreground text-xs'>
                {totalInvited} of {totalGuests} guests invited
              </div>
              {event.collectRsvp && totalInvited > 0 && (
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
              )}
              {totalInvited > 0 && (
                <div className='mt-1.5 flex items-center gap-1 border-border/50 border-t pt-1.5 text-xs'>
                  <div className='h-2 w-2 rounded-full bg-blue-500' />
                  <span className='font-medium'>~{event.estimatedAttendance}</span>
                  <span className='text-muted-foreground'>
                    of {totalInvited} estimated to attend
                  </span>
                </div>
              )}
            </div>
          )}

          <div className='flex items-center justify-between pt-2'>
            <Button
              variant='ghost'
              size='sm'
              className='text-xs md:text-sm'
              onClick={() => onManageGuests(event.id)}
            >
              <Users className='h-3.5 w-3.5 md:mr-1' />
              <span className='hidden md:inline'>Manage Guests</span>
              <span className='md:hidden'>Guests</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                  <MoreHorizontal className='h-4 w-4' />
                  <span className='sr-only'>Event actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => onEdit(event.id)}>
                  <Pencil className='mr-2 h-3.5 w-3.5' />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='text-red-600 focus:text-red-600'
                  onClick={() => onDelete(event.id)}
                >
                  <Trash2 className='mr-2 h-3.5 w-3.5' />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const EventCard = memo(EventCardBase)
