'use client'

/**
 * Events Page Client Component
 *
 * Displays list of events for the wedding.
 * Client component to enable interactivity (create/edit/delete).
 */

import { Calendar, Loader2, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { EventCard } from '@/app/(authenicated)/events/_components/event-card'
import {
  type EventFormData,
  transformToServerInput,
} from '~/components/forms/event/event-form.schema'
import { ModernEventForm } from '~/components/forms/event/modern-event-form'
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
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import type { EventWithStats } from '~/server/domains/event/event.types'
import { api } from '~/trpc/react'

type EventsPageClientProps = Readonly<{
  initialEvents: EventWithStats[]
  initialRsvpEventId?: string
}>

export function EventsPageClient({ initialEvents, initialRsvpEventId }: EventsPageClientProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventWithStats | undefined>(undefined)
  const [deletingEvent, setDeletingEvent] = useState<EventWithStats | undefined>(undefined)
  const utils = api.useUtils()

  // Fetch events with RSVP statistics
  const { data: events = initialEvents, isLoading } = api.event.getAllByUserIdWithStats.useQuery(
    undefined,
    {
      initialData: initialEvents,
    }
  )

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

  const handleEditEvent = useCallback(
    (eventId: string) => {
      const eventToEdit = events.find((event) => event.id === eventId)
      if (!eventToEdit) return
      setEditingEvent(eventToEdit)
    },
    [events]
  )

  const handleDeleteEvent = useCallback(
    (eventId: string) => {
      const eventToDelete = events.find((event) => event.id === eventId)
      if (!eventToDelete) return
      setDeletingEvent(eventToDelete)
    },
    [events]
  )

  // Show loading state
  if (isLoading && initialEvents.length === 0) {
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

        {isCreateDialogOpen ? (
          <ModernEventForm
            mode='create'
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSubmit={handleCreateEvent}
            isSubmitting={createEvent.isPending}
          />
        ) : null}
      </>
    )
  }

  const rsvpFocusEvent =
    initialRsvpEventId === undefined
      ? undefined
      : events.find((event) => event.id === initialRsvpEventId)

  return (
    <>
      {initialRsvpEventId !== undefined ? (
        <div className='mb-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm md:mb-6'>
          {rsvpFocusEvent
            ? `RSVP management context: ${rsvpFocusEvent.name}`
            : 'RSVP management context from Guests drawer'}
        </div>
      ) : null}
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
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
          />
        ))}
      </div>

      {isCreateDialogOpen ? (
        <ModernEventForm
          mode='create'
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleCreateEvent}
          isSubmitting={createEvent.isPending}
        />
      ) : null}

      {editingEvent ? (
        <ModernEventForm
          mode='edit'
          open
          onOpenChange={(open) => !open && setEditingEvent(undefined)}
          onSubmit={handleUpdateEvent}
          event={editingEvent}
          isSubmitting={updateEvent.isPending}
        />
      ) : null}

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
