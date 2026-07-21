'use client'

/**
 * Events Page Client Component
 *
 * Displays list of events for the wedding.
 * Client component to enable interactivity (create/edit/delete).
 */

import { Loader2, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { EventCard } from '@/app/(authenicated)/events/_components/event-card'
import { ManageEventGuestsDialog } from '@/app/(authenicated)/events/_components/manage-event-guests-dialog'
import { ManageEventQuestionsDialog } from '@/app/(authenicated)/events/_components/manage-event-questions-dialog'
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
import type { Event, EventWithStats } from '~/server/domains/event/event.types'
import { api } from '~/trpc/react'

type EventsPageClientProps = Readonly<{
  initialEvents: EventWithStats[]
  initialRsvpEventId?: string
}>

export function EventsPageClient({ initialEvents, initialRsvpEventId }: EventsPageClientProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventWithStats | undefined>(undefined)
  const [deletingEvent, setDeletingEvent] = useState<EventWithStats | undefined>(undefined)
  const [managingGuestsEvent, setManagingGuestsEvent] = useState<EventWithStats | undefined>(
    undefined
  )
  const [managingQuestionsEventId, setManagingQuestionsEventId] = useState<string | null>(null)
  const [togglingRsvpEventId, setTogglingRsvpEventId] = useState<string | null>(null)
  const utils = api.useUtils()

  // Fetch events with RSVP statistics
  const { data: events = initialEvents, isLoading } = api.event.getAllByUserIdWithStats.useQuery(
    undefined,
    {
      initialData: initialEvents,
      staleTime: 30_000,
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
    onSuccess: (updatedEvent: Event) => {
      utils.event.getAllByUserIdWithStats.setData(undefined, (previousEvents) => {
        if (!previousEvents) return previousEvents

        return previousEvents.map((event) => {
          if (event.id !== updatedEvent.id) return event

          return {
            ...event,
            ...updatedEvent,
          }
        })
      })

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
    onSuccess: (deletedEventId: string) => {
      utils.event.getAllByUserIdWithStats.setData(undefined, (previousEvents) => {
        if (!previousEvents) return previousEvents

        return previousEvents.filter((event) => event.id !== deletedEventId)
      })

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

  const updateCollectRsvp = api.event.updateCollectRsvp.useMutation({
    onSuccess: async (updatedEvent) => {
      setTogglingRsvpEventId(null)
      utils.event.getAllByUserIdWithStats.setData(undefined, (previousEvents) => {
        if (!previousEvents) return previousEvents

        return previousEvents.map((event) => {
          if (event.id !== updatedEvent.id) return event

          return {
            ...event,
            collectRsvp: updatedEvent.collectRsvp,
          }
        })
      })
      toast.success('RSVP settings updated')
    },
    onError: (error) => {
      setTogglingRsvpEventId(null)
      toast.error('Error updating RSVP settings', {
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

  const handleManageGuests = useCallback(
    (eventId: string) => {
      const eventToManage = events.find((event) => event.id === eventId)
      if (!eventToManage) return
      setManagingGuestsEvent(eventToManage)
    },
    [events]
  )

  const handleManageQuestions = useCallback((eventId: string) => {
    setManagingQuestionsEventId(eventId)
  }, [])

  const managingQuestionsEvent =
    managingQuestionsEventId === null
      ? undefined
      : events.find((event) => event.id === managingQuestionsEventId)

  const handleToggleCollectRsvp = useCallback(
    (eventId: string, collectRsvp: boolean) => {
      setTogglingRsvpEventId(eventId)
      updateCollectRsvp.mutate({
        eventId,
        collectRsvp,
      })
    },
    [updateCollectRsvp]
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
        <div className='flex flex-col items-center gap-5 py-20 text-center'>
          <div className='flex h-16 w-16 items-center justify-center rounded-full border border-border/80 bg-muted/50'>
            <span className='text-2xl opacity-50' aria-hidden='true'>
              ☷
            </span>
          </div>
          <div className='max-w-sm'>
            <p className='font-serif text-xl text-foreground'>No events yet</p>
            <p className='mt-2 font-mono text-[0.65rem] text-foreground/55 leading-relaxed tracking-wider'>
              Get started by creating your first wedding event. Add ceremonies, receptions,
              rehearsal dinners, and more.
            </p>
          </div>
          <Button
            type='button'
            onClick={() => setIsCreateDialogOpen(true)}
            className='font-mono text-[0.65rem] uppercase tracking-widest'
          >
            Create your first event
          </Button>
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
      </>
    )
  }

  const rsvpFocusEvent =
    initialRsvpEventId === undefined
      ? undefined
      : events.find((event) => event.id === initialRsvpEventId)

  const sortedEvents = [...events].sort((a, b) => {
    if (a.date === null && b.date === null) return 0
    if (a.date === null) return 1
    if (b.date === null) return -1
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

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

      <div className='grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3'>
        {sortedEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
            onManageGuests={handleManageGuests}
            onManageQuestions={handleManageQuestions}
            onToggleCollectRsvp={handleToggleCollectRsvp}
            isTogglingCollectRsvp={togglingRsvpEventId === event.id}
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
              className='flex items-center gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleteEvent.isPending && <Loader2 className='h-4 w-4 animate-spin' />}
              {deleteEvent.isPending ? 'Deleting...' : 'Delete Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {managingGuestsEvent ? (
        <ManageEventGuestsDialog
          event={managingGuestsEvent}
          open
          onOpenChange={(open) => !open && setManagingGuestsEvent(undefined)}
        />
      ) : null}

      {managingQuestionsEvent ? (
        <ManageEventQuestionsDialog
          event={managingQuestionsEvent}
          open
          onOpenChange={(open) => !open && setManagingQuestionsEventId(null)}
        />
      ) : null}
    </>
  )
}
