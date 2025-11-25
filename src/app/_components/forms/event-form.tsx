'use client'

import { useState } from 'react'
import { IoMdClose } from 'react-icons/io'

import { useToggleEventForm } from '~/app/_components/contexts/event-form-context'
import AnimatedInputLabel from '~/app/_components/forms/animated-input-label'
import DeleteConfirmation from '~/app/_components/forms/delete-confirmation'
import DateInput from '~/app/_components/forms/event/date-input'
import TimeSelections from '~/app/_components/forms/event/time-selections'
import SidePaneWrapper from '~/app/_components/forms/wrapper'
import { useEventFormActions } from '~/app/_components/hooks/forms/useEventFormActions'
import { sharedStyles } from '~/app/utils/shared-styles'
import { type EventFormData } from '~/app/utils/shared-types'

type EventFormProps = {
  prefillFormData: EventFormData | undefined
}

const defaultFormData = {
  eventName: '',
  date: undefined,
  startTime: undefined,
  endTime: undefined,
  venue: undefined,
  attire: undefined,
  description: undefined,
  eventId: '',
}

export default function EventForm({ prefillFormData }: EventFormProps) {
  const isEditMode = !!prefillFormData
  const toggleEventForm = useToggleEventForm()

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false)
  const [eventFormData, setEventFormData] = useState<EventFormData>(
    prefillFormData ?? defaultFormData
  )

  const {
    createEvent,
    isCreatingEvent,
    updateEvent,
    isUpdatingEvent,
    deleteEvent,
    isDeletingEvent,
  } = useEventFormActions()

  const handleOnChange = ({ field, inputValue }: { field: string; inputValue: string }) => {
    setEventFormData((prev) => {
      return {
        ...prev,
        [field]: inputValue,
      }
    })
  }

  const handleSaveEvent = () => {
    if (isEditMode) {
      updateEvent(eventFormData)
    } else {
      createEvent(eventFormData)
    }
  }

  const isProcessing = isCreatingEvent || isUpdatingEvent || isDeletingEvent

  if (showDeleteConfirmation) {
    return (
      <DeleteConfirmation
        isProcessing={isProcessing}
        disclaimerText={
          'Deleting this event will remove it from your website, and also erase any guest lists, RSVPs, and meals associated with it.'
        }
        noHandler={() => setShowDeleteConfirmation(false)}
        yesHandler={() => deleteEvent({ eventId: eventFormData.eventId })}
      />
    )
  }

  return (
    <SidePaneWrapper>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSaveEvent()
        }}
      >
        <div className="flex justify-between border-b p-5">
          <h1 className="text-xl font-semibold">{isEditMode ? 'Edit Event' : 'Add Event'}</h1>
          <IoMdClose size={25} className="cursor-pointer" onClick={() => toggleEventForm()} />
        </div>
        <div className="p-5">
          <h2 className="mb-3 text-xl font-semibold">Event Information</h2>
          <div className="grid grid-cols-1 grid-rows-[repeat(6,50px)] gap-5">
            <AnimatedInputLabel
              id="event-name"
              inputValue={eventFormData.eventName}
              fieldName="eventName"
              labelText="Event Name*"
              required={true}
              handleOnChange={handleOnChange}
            />
            <DateInput eventDate={eventFormData.date} handleOnChange={handleOnChange} />
            <TimeSelections
              startTime={eventFormData.startTime}
              endTime={eventFormData.endTime}
              handleOnChange={handleOnChange}
            />
            <AnimatedInputLabel
              id="event-venue"
              inputValue={eventFormData.venue ?? ''}
              fieldName="venue"
              labelText="Venue Name"
              handleOnChange={handleOnChange}
            />
            <AnimatedInputLabel
              id="event-attire"
              inputValue={eventFormData.attire ?? ''}
              fieldName="attire"
              labelText="Attire"
              handleOnChange={handleOnChange}
            />
            <AnimatedInputLabel
              id="event-description"
              inputValue={eventFormData.description ?? ''}
              fieldName="description"
              labelText="Description"
              handleOnChange={handleOnChange}
            />
          </div>
        </div>
        <div
          className={`fixed bottom-0 flex ${sharedStyles.sidebarFormWidth} flex-col gap-3 border-t px-8 py-5`}
        >
          <div className="flex gap-5">
            <button
              disabled={isProcessing}
              onClick={() => toggleEventForm()}
              className={`${sharedStyles.secondaryButton({
                py: 'py-2',
                isLoading: isProcessing,
              })} w-1/2 ${isProcessing ? 'text-pink-200' : `text-${sharedStyles.primaryColor}`}`}
            >
              Cancel
            </button>
            <button
              id="save-event"
              type="submit"
              name="save-event"
              disabled={isProcessing}
              className={`w-1/2 ${sharedStyles.primaryButton({
                py: 'py-2',
                isLoading: isProcessing,
              })}`}
            >
              {isProcessing ? 'Processing...' : 'Save & Close'}
            </button>
          </div>
          {isEditMode && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setShowDeleteConfirmation(true)}
              className={`font-semibold ${
                isProcessing
                  ? 'cursor-not-allowed text-pink-200'
                  : `text-${sharedStyles.primaryColor} hover:underline`
              }`}
            >
              Remove Event
            </button>
          )}
        </div>
      </form>
    </SidePaneWrapper>
  )
}
