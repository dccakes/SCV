'use client'

import { useState } from 'react'
import { type SyntheticEvent } from 'react'
import { IoMdClose } from 'react-icons/io'

import { useToggleGuestForm } from '~/app/_components/contexts/guest-form-context'
import DeleteConfirmation from '~/app/_components/forms/delete-confirmation'
import AddFormButtons from '~/app/_components/forms/guest/add-buttons'
import ContactForm from '~/app/_components/forms/guest/contact-form'
import EditFormButtons from '~/app/_components/forms/guest/edit-buttons'
import GiftSection from '~/app/_components/forms/guest/gift-section'
import { GuestNameForm } from '~/app/_components/forms/guest/guest-names'
import SidePaneWrapper from '~/app/_components/forms/wrapper'
import { useGuestFormActions } from '~/app/_components/hooks/forms/useGuestFormActions'
import { sharedStyles } from '~/app/utils/shared-styles'
import {
  type Event,
  type FormInvites,
  type Gift,
  type HouseholdFormData,
} from '~/app/utils/shared-types'

const defaultContactData = {
  address1: undefined,
  address2: undefined,
  city: undefined,
  state: undefined,
  country: undefined,
  zipCode: undefined,
  phone: undefined,
  email: undefined,
  notes: undefined,
}

const defaultHouseholdFormData = (events: Event[]) => {
  const invites: FormInvites = {}
  const gifts: Gift[] = []
  events.forEach((event: Event) => {
    invites[event.id] = 'Not Invited'
    gifts.push({
      eventId: event.id,
      thankyou: false,
      description: undefined,
    })
  })
  return {
    ...defaultContactData,
    householdId: '',
    guestParty: [
      {
        firstName: '',
        lastName: '',
        invites,
      },
    ],
    gifts,
  }
}

type GuestFormProps = {
  events: Event[]
  prefillFormData: HouseholdFormData | undefined
}

export default function GuestForm({ events, prefillFormData }: GuestFormProps) {
  const isEditMode = !!prefillFormData
  const toggleGuestForm = useToggleGuestForm()
  const [closeForm, setCloseForm] = useState<boolean>(false)
  const [deletedGuests, setDeletedGuests] = useState<number[]>([])
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false)
  const [householdFormData, setHouseholdFormData] = useState<HouseholdFormData>(
    prefillFormData ?? defaultHouseholdFormData(events)
  )

  const resetForm = () => {
    setHouseholdFormData(defaultHouseholdFormData(events))
  }

  const {
    createGuests,
    isCreatingGuests,
    updateHousehold,
    isUpdatingHousehold,
    deleteHousehold,
    isDeletingHousehold,
  } = useGuestFormActions(closeForm, resetForm)

  const getTitle = () => {
    if (!isEditMode || !prefillFormData) return 'Add Party'
    const primaryContact = prefillFormData.guestParty.find((guest) => guest.isPrimaryContact)
    const numGuests = prefillFormData.guestParty.length
    const primaryContactName = primaryContact?.firstName + ' ' + primaryContact?.lastName

    return numGuests > 1 ? `${primaryContactName} + ${numGuests - 1}` : primaryContactName
  }

  const handleOnChange = ({ field, inputValue }: { field: string; inputValue: string }) => {
    setHouseholdFormData((prev) => {
      return {
        ...prev,
        [field]: inputValue,
      }
    })
  }

  const handleAddGuestToParty = () => {
    const invites: FormInvites = {}
    events.forEach((event: Event) => (invites[event.id] = 'Not Invited'))
    setHouseholdFormData((prev) => {
      return {
        ...prev,
        guestParty: [
          ...prev.guestParty,
          {
            firstName: '',
            lastName: '',
            invites,
          },
        ],
      }
    })
  }

  const handleOnSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    interface SubmitEvent extends Event {
      submitter: HTMLButtonElement
    }
    const submitButton = (e.nativeEvent as unknown as SubmitEvent).submitter

    if (submitButton.name === 'add-button') {
      createGuests(householdFormData)
    } else {
      updateHousehold({ ...householdFormData, deletedGuests })
    }
  }

  if (showDeleteConfirmation) {
    return (
      <DeleteConfirmation
        isProcessing={isDeletingHousehold}
        disclaimerText={
          'Please confirm whether you would like to delete this party along with all its guests.'
        }
        noHandler={() => setShowDeleteConfirmation(false)}
        yesHandler={() =>
          deleteHousehold({
            householdId: householdFormData.householdId,
          })
        }
      />
    )
  }

  return (
    <SidePaneWrapper>
      <form
        className={`pb-28 ${sharedStyles.sidebarFormWidth}`}
        onSubmit={(e) => handleOnSubmit(e)}
      >
        <div className="flex justify-between border-b p-5">
          <h1 className="text-2xl font-bold">{getTitle()}</h1>
          <IoMdClose size={25} className="cursor-pointer" onClick={() => toggleGuestForm()} />
        </div>
        {householdFormData?.guestParty.map((guest, i) => {
          return (
            <GuestNameForm
              key={i}
              events={events}
              guestIndex={i}
              guest={guest}
              setHouseholdFormData={setHouseholdFormData}
              setDeletedGuests={setDeletedGuests}
            />
          )
        })}
        <button
          type="button"
          onClick={() => handleAddGuestToParty()}
          className={`m-auto w-full py-2 text-${sharedStyles.primaryColor}`}
        >
          + Add A Guest To This Party
        </button>
        <div className="p-5">
          <h2 className="mb-3 text-2xl font-bold">Contact Information</h2>
          <ContactForm householdFormData={householdFormData} handleOnChange={handleOnChange} />
          <h2 className="my-4 text-2xl font-bold">My Notes</h2>
          <textarea
            placeholder="Enter notes about your guests, like food allergies"
            value={householdFormData.notes}
            onChange={(e) => handleOnChange({ field: 'notes', inputValue: e.target.value })}
            className="h-32 w-full rounded-lg border p-3"
            style={{ resize: 'none' }}
          />
          {isEditMode && (
            <GiftSection
              setHouseholdFormData={setHouseholdFormData}
              householdFormData={householdFormData}
            />
          )}
        </div>
        {isEditMode ? (
          <EditFormButtons
            isUpdatingHousehold={isUpdatingHousehold}
            setShowDeleteConfirmation={setShowDeleteConfirmation}
          />
        ) : (
          <AddFormButtons isCreatingGuests={isCreatingGuests} setCloseForm={setCloseForm} />
        )}
      </form>
    </SidePaneWrapper>
  )
}
