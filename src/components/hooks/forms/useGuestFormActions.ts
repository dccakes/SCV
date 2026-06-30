import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { useToggleGuestForm } from '~/components/contexts/guest-form-context'
import { api } from '~/trpc/react'

const useGuestFormActions = (closeForm: boolean, resetForm: () => void) => {
  const router = useRouter()
  const toggleGuestForm = useToggleGuestForm()
  const createGuests = api.household.create.useMutation({
    onSuccess: () => {
      if (closeForm) toggleGuestForm()
      router.refresh()
      resetForm()
    },
    onError: (err) => {
      const fieldError = err.data?.zodError?.fieldErrors?.guestParty?.[0]
      toast.error('Failed to create guests', {
        description: fieldError ?? err.message ?? 'Please try again later.',
      })
    },
  })

  const updateHousehold = api.household.update.useMutation({
    onSuccess: () => {
      toggleGuestForm()
      router.refresh()
      resetForm()
    },
    onError: (err) => {
      const fieldError = err.data?.zodError?.fieldErrors?.guestParty?.[0]
      toast.error('Failed to update party', {
        description: fieldError ?? err.message ?? 'Please try again later.',
      })
    },
  })

  const deleteHousehold = api.household.delete.useMutation({
    onSuccess: () => {
      toggleGuestForm()
      router.refresh()
    },
    onError: (err) => {
      const fieldError = err.data?.zodError?.fieldErrors?.eventName?.[0]
      toast.error('Failed to delete household', {
        description: fieldError ?? err.message ?? 'Please try again later.',
      })
    },
  })

  return {
    createGuests: createGuests.mutate,
    updateHousehold: updateHousehold.mutate,
    deleteHousehold: deleteHousehold.mutate,
    isCreatingGuests: createGuests.isPending,
    isUpdatingHousehold: updateHousehold.isPending,
    isDeletingHousehold: deleteHousehold.isPending,
  }
}

export { useGuestFormActions }
