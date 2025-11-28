'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { type SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { IoMdClose } from 'react-icons/io'
import { toast } from 'sonner'

import { useToggleGuestForm } from '~/app/_components/contexts/guest-form-context'
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
import { type Event, type FormInvites } from '~/app/utils/shared-types'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion'
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
import { Label } from '~/components/ui/label'
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

  // Fetch tags for the current wedding
  const { data: tags = [] } = api.guestTag.getAll.useQuery()

  // Mutations directly in component
  const createMutation = api.household.create.useMutation({
    onSuccess: () => {
      toast.success('Party created successfully!')
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
        toast.error('Please fix the form errors')
      } else {
        toast.error('Failed to create party. Please try again.')
      }
    },
  })

  const updateMutation = api.household.update.useMutation({
    onSuccess: (data) => {
      toast.success('Party updated successfully!')
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
        toast.error('Please fix the form errors')
      } else {
        toast.error('Failed to update party. Please try again.')
      }
    },
  })

  const deleteMutation = api.household.delete.useMutation({
    onSuccess: () => {
      toast.success('Party deleted successfully!')
      toggleGuestForm()
      router.refresh()
    },
    onError: () => {
      toast.error('Failed to delete party. Please try again.')
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
      ageGroup: 'ADULT' as const,
      tagIds: [],
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

  return (
    <SidePaneWrapper>
      <form className="flex h-full flex-col" onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-background p-6">
          <h1 className="mr-4 truncate text-2xl font-bold">{getTitle()}</h1>
          <button
            type="button"
            onClick={() => toggleGuestForm()}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-32">
          {/* Display validation error for guestParty array */}
          {errors.guestParty && typeof errors.guestParty.message === 'string' && (
            <div className="bg-destructive/10 mx-6 mt-4 rounded-lg border border-destructive p-4">
              <p className="text-sm font-medium text-destructive">{errors.guestParty.message}</p>
            </div>
          )}

          <Accordion
            type="multiple"
            defaultValue={['guests', 'contact', 'notes']}
            className="w-full"
          >
            <AccordionItem value="guests" className="border-b-0">
              <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:no-underline">
                Guest Party ({fields.length})
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                {fields.map((field, index) => (
                  <GuestNameForm
                    key={field.id}
                    events={events}
                    tags={tags}
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
                  className="hover:bg-muted/50 w-full border-t py-4 text-sm font-medium text-primary transition-colors"
                >
                  + Add A Guest To This Party
                </button>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contact" className="border-b-0">
              <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:no-underline">
                Contact Information
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <ContactForm register={register} errors={errors} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="notes" className="border-b-0">
              <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:no-underline">
                Notes
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Information</Label>
                  <textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Enter notes about your guests, like food allergies or special requests"
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {errors.notes && (
                    <p className="text-sm text-destructive">{errors.notes.message}</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {isEditMode && (
              <AccordionItem value="gifts" className="border-b-0">
                <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:no-underline">
                  Gifts
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <GiftSection
                    control={control}
                    register={register}
                    errors={errors}
                    events={events}
                  />
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
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

      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Party?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this party and all associated guests. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                deleteMutation.mutate({ householdId })
              }}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Party'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidePaneWrapper>
  )
}
