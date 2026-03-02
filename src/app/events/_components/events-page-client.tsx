'use client'

/**
 * Events Page Client Component
 *
 * Displays list of events for the wedding.
 * Client component to enable interactivity (create/edit/delete).
 */

import { format } from 'date-fns'
import { Calendar, Loader2, MapPin, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  type EventFormData,
  transformToServerInput,
} from '~/app/_components/forms/event/event-form.schema'
import { ModernEventForm } from '~/app/_components/forms/event/modern-event-form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import type { EventWithStats } from '~/server/domains/event/event.types'
import { api } from '~/trpc/react'

export function EventsPageClient() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventWithStats | undefined>(undefined)
  const [deletingEvent, setDeletingEvent] = useState<EventWithStats | undefined>(undefined)
  const utils = api.useUtils()

  // Fetch events with RSVP statistics
  const { data: events = [], isLoading } = api.event.getAllByUserIdWithStats.useQuery()

  const createEvent = api.event.create.useMutation({
    onSuccess: async () => {
      // Wait for data to refetch before closing dialog
      await utils.event.getAllByUserIdWithStats.invalidate()
      toast.success('Event created', {
        description: 'Your event has been created successfully.',
      })
      setIsCreateDialogOpen(false)
    },
    onError: (error) => {
      toast.error('Error creating event', {
        description: error.message,
      })
    },
  })

  const updateEvent = api.event.update.useMutation({
    onSuccess: async () => {
      // Wait for data to refetch before closing dialog
      await utils.event.getAllByUserIdWithStats.invalidate()
      toast.success('Event updated', {
        description: 'Your event has been updated successfully.',
      })
      setEditingEvent(undefined)
    },
    onError: (error) => {
      toast.error('Error updating event', {
        description: error.message,
      })
    },
  })

  const deleteEvent = api.event.delete.useMutation({
    onSuccess: async () => {
      await utils.event.getAllByUserIdWithStats.invalidate()
      toast.success('Event deleted', {
        description: 'Your event has been deleted successfully.',
      })
      setDeletingEvent(undefined)
    },
    onError: (error) => {
      toast.error('Error deleting event', {
        description: error.message,
      })
    },
  })

  const handleCreateEvent = async (data: EventFormData) => {
    await createEvent.mutateAsync(transformToServerInput(data))
  }

  const handleUpdateEvent = async (data: EventFormData) => {
    if (!editingEvent) return
    await updateEvent.mutateAsync({
      eventId: editingEvent.id,
      ...transformToServerInput(data),
    })
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <p className='text-muted-foreground text-sm'>Loading events...</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <>
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-8 text-center md:py-12'>
            <div className='mb-4 rounded-full bg-muted p-4 md:p-6'>
              <Calendar className='h-10 w-10 text-muted-foreground md:h-12 md:w-12' />
            </div>
            <h2 className='mb-2 font-semibold text-xl md:text-2xl'>No events yet</h2>
            <p className='mb-6 max-w-md px-4 text-muted-foreground text-sm md:text-base'>
              Get started by creating your first wedding event. You can add ceremonies, receptions,
              rehearsal dinners, and more.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className='mr-2 h-4 w-4' />
              Create Event
            </Button>
          </CardContent>
        </Card>

        <ModernEventForm
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleCreateEvent}
          isSubmitting={createEvent.isPending}
        />
      </>
    )
  }

  return (
    <>
      <div className='mb-4 flex items-center justify-between md:mb-6'>
        <p className='text-muted-foreground text-sm'>
          {events.length} {events.length === 1 ? 'event' : 'events'}
        </p>
        <Button onClick={() => setIsCreateDialogOpen(true)} size='sm'>
          <Plus className='mr-2 h-4 w-4' />
          Create Event
        </Button>
      </div>

      <div className='grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3'>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onEdit={() => setEditingEvent(event)}
            onDelete={() => setDeletingEvent(event)}
          />
        ))}
      </div>

      <ModernEventForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateEvent}
        isSubmitting={createEvent.isPending}
      />

      <ModernEventForm
        open={!!editingEvent}
        onOpenChange={(open) => !open && setEditingEvent(undefined)}
        onSubmit={handleUpdateEvent}
        event={editingEvent}
        isSubmitting={updateEvent.isPending}
      />

      <AlertDialog
        open={!!deletingEvent}
        onOpenChange={(open) => !open && setDeletingEvent(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingEvent?.name}&quot; and all associated
              invitations, questions, and responses. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteEvent.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (deletingEvent) {
                  deleteEvent.mutate({ eventId: deletingEvent.id })
                }
              }}
              disabled={deleteEvent.isPending}
              className='flex items-center gap-2 bg-red-600 hover:bg-red-700'
            >
              {deleteEvent.isPending && <Loader2 className='h-4 w-4 animate-spin' />}
              {deleteEvent.isPending ? 'Deleting...' : 'Delete Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

type EventCardProps = Readonly<{
  event: EventWithStats
  onEdit: () => void
  onDelete: () => void
}>

function EventCard({ event, onEdit, onDelete }: EventCardProps) {
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
            </div>
          )}

          <div className='flex gap-2 pt-2'>
            <Button variant='outline' size='sm' className='flex-1 text-xs md:text-sm'>
              View Details
            </Button>
            <Button variant='ghost' size='sm' className='text-xs md:text-sm' onClick={onEdit}>
              Edit
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='text-red-600 text-xs hover:text-red-700 md:text-sm'
              onClick={onDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
