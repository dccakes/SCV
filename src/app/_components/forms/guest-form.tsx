'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { type SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { IoMdClose } from 'react-icons/io'

import { useToggleGuestForm } from '~/app/_components/contexts/guest-form-context'
import DeleteConfirmation from '~/app/_components/forms/delete-confirmation'
import AddFormButtons from '~/app/_components/forms/guest/add-buttons'
import ContactForm from '~/app/_components/forms/guest/contact-form'
import EditFormButtons from '~/app/_components/forms/guest/edit-buttons'
import GiftSection from '~/app/_components/forms/guest/gift-section'
import { GuestNameForm } from '~/app/_components/forms/guest/guest-names'
import {
  getDefaultHouseholdFormData,
  type HouseholdFormData,
  HouseholdFormSchema,
} from '~/app/_components/forms/guest-form.schema'
import SidePaneWrapper from '~/app/_components/forms/wrapper'
import { getDirtyValues } from '~/app/utils/form-helpers'
import { sharedStyles } from '~/app/utils/shared-styles'
import { type Event, type FormInvites } from '~/app/utils/shared-types'
import { api } from '~/trpc/react'

type GuestFormProps = {
  events: Event[]
  prefillFormData: HouseholdFormData | undefined
}

export default function GuestForm({ events, prefillFormData }: GuestFormProps) {
  const isEditMode = !!prefillFormData
  const router = useRouter()
  const toggleGuestForm = useToggleGuestForm()
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false)
  const [shouldCloseAfterSave, setShouldCloseAfterSave] = useState<boolean>(true)

  // Initialize react-hook-form
  const form = useForm<HouseholdFormData>({
    resolver: zodResolver(HouseholdFormSchema),
    defaultValues: prefillFormData ?? getDefaultHouseholdFormData(events),
    mode: 'onChange', // Real-time validation for better UX
  })

  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
    reset,
    watch,
    setValue,
    setError,
  } = form

  // Use field array for managing guest party
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'guestParty',
  })

  // Mutations directly in component
  const createMutation = api.household.create.useMutation({
    onSuccess: () => {
      reset(getDefaultHouseholdFormData(events))
      if (shouldCloseAfterSave) {
        toggleGuestForm()
      }
      router.refresh()
    },
    onError: (err) => {
      const zodErrors = err.data?.zodError?.fieldErrors
      if (zodErrors) {
        // Map server errors back to form fields
        Object.entries(zodErrors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof HouseholdFormData, {
              type: 'server',
              message: messages[0],
            })
          }
        })
      } else {
        window.alert('Failed to create guests! Please try again later.')
      }
    },
  })

  const updateMutation = api.household.update.useMutation({
    onSuccess: (data) => {
      // Reset form with updated data to clear dirty state
      if (data) {
        reset(data as unknown as HouseholdFormData)
      }
      toggleGuestForm()
      router.refresh()
    },
    onError: (err) => {
      const zodErrors = err.data?.zodError?.fieldErrors
      if (zodErrors) {
        Object.entries(zodErrors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof HouseholdFormData, {
              type: 'server',
              message: messages[0],
            })
          }
        })
      } else {
        window.alert('Failed to update party! Please try again later.')
      }
    },
  })

  const deleteMutation = api.household.delete.useMutation({
    onSuccess: () => {
      toggleGuestForm()
      router.refresh()
    },
    onError: () => {
      window.alert('Failed to delete party! Please try again later.')
    },
  })

  const getTitle = () => {
    if (!isEditMode || !prefillFormData) return 'Add Party'
    const primaryContact = prefillFormData.guestParty.find((guest) => guest.isPrimaryContact)
    const numGuests = prefillFormData.guestParty.length
    const primaryContactName = primaryContact?.firstName + ' ' + primaryContact?.lastName

    return numGuests > 1 ? `${primaryContactName} + ${numGuests - 1}` : primaryContactName
  }

  const handleAddGuestToParty = () => {
    const invites: FormInvites = {}
    events.forEach((event: Event) => (invites[event.id] = 'Not Invited'))

    append({
      firstName: '',
      lastName: '',
      email: null,
      phone: null,
      isPrimaryContact: false,
      invites,
    })
  }

  const handleRemoveGuest = (index: number) => {
    const guest = fields[index]
    if (guest && 'guestId' in guest && typeof guest.guestId === 'number') {
      // Track deleted guest in form state
      const currentDeleted = watch('deletedGuests') ?? []
      setValue('deletedGuests', [...currentDeleted, guest.guestId], {
        shouldDirty: true,
      })
    }
    remove(index)
  }

  const onSubmit: SubmitHandler<HouseholdFormData> = async (data) => {
    // Prevent submission if nothing changed in edit mode
    if (!isDirty && isEditMode) {
      toggleGuestForm()
      return
    }

    if (isEditMode) {
      // Only send changed fields for updates (but always include required fields)
      const changedData = getDirtyValues(dirtyFields, data)
      const deletedGuests = data.deletedGuests ?? []

      // Server expects these fields for update
      updateMutation.mutate({
        householdId: data.householdId, // Required
        guestParty: data.guestParty, // Required
        gifts: data.gifts, // Required
        ...changedData, // Add any other changed fields
        deletedGuests: deletedGuests.length > 0 ? deletedGuests : undefined,
      } as Parameters<typeof updateMutation.mutate>[0])
    } else {
      // Send all data for create
      createMutation.mutate(data)
    }
  }

  // Watch householdId outside conditional for React Hook rules
  const householdId = watch('householdId')

  // Combined loading state from mutations
  const isLoading = isSubmitting || createMutation.isPending || updateMutation.isPending

  if (showDeleteConfirmation) {
    return (
      <DeleteConfirmation
        isProcessing={deleteMutation.isPending}
        disclaimerText={
          'Please confirm whether you would like to delete this party along with all its guests.'
        }
        noHandler={() => setShowDeleteConfirmation(false)}
        yesHandler={() =>
          deleteMutation.mutate({
            householdId,
          })
        }
      />
    )
  }

  return (
    <SidePaneWrapper>
      <form className={`pb-28 ${sharedStyles.sidebarFormWidth}`} onSubmit={handleSubmit(onSubmit)}>
        <div className="flex justify-between border-b p-5">
          <h1 className="text-2xl font-bold">{getTitle()}</h1>
          <IoMdClose size={25} className="cursor-pointer" onClick={() => toggleGuestForm()} />
        </div>

        {/* Display validation error for guestParty array */}
        {errors.guestParty && typeof errors.guestParty.message === 'string' && (
          <div className="mx-5 mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {errors.guestParty.message}
          </div>
        )}

        {fields.map((field, index) => (
          <GuestNameForm
            key={field.id}
            events={events}
            guestIndex={index}
            control={control}
            register={register}
            errors={errors}
            handleRemoveGuest={handleRemoveGuest}
            setValue={setValue}
          />
        ))}

        <button
          type="button"
          onClick={handleAddGuestToParty}
          className={`m-auto w-full py-2 text-${sharedStyles.primaryColor}`}
        >
          + Add A Guest To This Party
        </button>

        <div className="p-5">
          <h2 className="mb-3 text-2xl font-bold">Contact Information</h2>
          <ContactForm register={register} errors={errors} />

          <h2 className="my-4 text-2xl font-bold">My Notes</h2>
          <textarea
            {...register('notes')}
            placeholder="Enter notes about your guests, like food allergies"
            className="h-32 w-full rounded-lg border p-3"
            style={{ resize: 'none' }}
          />
          {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}

          {isEditMode && (
            <GiftSection control={control} register={register} errors={errors} events={events} />
          )}
        </div>

        {isEditMode ? (
          <EditFormButtons
            isUpdatingHousehold={isLoading}
            setShowDeleteConfirmation={setShowDeleteConfirmation}
          />
        ) : (
          <AddFormButtons
            isCreatingGuests={isLoading}
            shouldCloseAfterSave={shouldCloseAfterSave}
            onSaveIntentChange={setShouldCloseAfterSave}
          />
        )}
      </form>
    </SidePaneWrapper>
  )
}
