import { useRouter } from 'next/navigation'

import { useToggleGuestForm } from '~/app/_components/contexts/guest-form-context'
import { api } from '~/trpc/react'

const useGuestFormActions = (closeForm: boolean, resetForm: () => void) => {
  const router = useRouter()
  const toggleGuestForm = useToggleGuestForm()
  const createGuests = api.household.create.useMutation({
    onSuccess: () => {
      closeForm && toggleGuestForm()
      router.refresh()
      resetForm()
    },
    onError: (err) => {
      const errorMessage = err.data?.zodError?.fieldErrors?.guestParty
      if (errorMessage?.[0]) window.alert(errorMessage)
      else window.alert('Failed to create guests! Please try again later.')
    },
  })

  const updateHousehold = api.household.update.useMutation({
    onSuccess: () => {
      toggleGuestForm()
      router.refresh()
      resetForm()
    },
    onError: (err) => {
      const errorMessage = err.data?.zodError?.fieldErrors?.guestParty
      if (errorMessage?.[0]) window.alert(errorMessage)
      else window.alert('Failed to update party! Please try again later.')
    },
  })

  const deleteHousehold = api.household.delete.useMutation({
    onSuccess: () => {
      toggleGuestForm()
      router.refresh()
    },
    onError: (err) => {
      const errorMessage = err.data?.zodError?.fieldErrors?.eventName
      if (errorMessage?.[0]) window.alert(errorMessage)
      else window.alert('Failed to delete event! Please try again later.')
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
