import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { useToggleEventForm } from '~/components/contexts/event-form-context'
import { api } from '~/trpc/react'

const useEventFormActions = () => {
  const router = useRouter()
  const toggleEventForm = useToggleEventForm()

  const createEvent = api.event.create.useMutation({
    onSuccess: () => {
      toggleEventForm()
      router.refresh()
    },
    onError: (err) => {
      const fieldError = err.data?.zodError?.fieldErrors?.eventName?.[0]
      toast.error('Failed to create event', {
        description: fieldError ?? err.message ?? 'Please try again later.',
      })
    },
  })

  const updateEvent = api.event.update.useMutation({
    onSuccess: () => {
      toggleEventForm()
      router.refresh()
    },
    onError: (err) => {
      const fieldError = err.data?.zodError?.fieldErrors?.eventName?.[0]
      toast.error('Failed to update event', {
        description: fieldError ?? err.message ?? 'Please try again later.',
      })
    },
  })

  const deleteEvent = api.event.delete.useMutation({
    onSuccess: () => {
      toggleEventForm()
      router.refresh()
    },
    onError: (err) => {
      const fieldError = err.data?.zodError?.fieldErrors?.eventName?.[0]
      toast.error('Failed to delete event', {
        description: fieldError ?? err.message ?? 'Please try again later.',
      })
    },
  })

  return {
    createEvent: createEvent.mutate,
    updateEvent: updateEvent.mutate,
    deleteEvent: deleteEvent.mutate,
    isCreatingEvent: createEvent.isPending,
    isUpdatingEvent: updateEvent.isPending,
    isDeletingEvent: deleteEvent.isPending,
  }
}

export { useEventFormActions }
