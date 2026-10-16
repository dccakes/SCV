'use client'

import { useState } from 'react'
import { IoMdClose } from 'react-icons/io'
import { sharedStyles } from '~/app/utils/shared-styles'
import type { EventFormData } from '~/app/utils/shared-types'
import { useToggleEventForm } from '~/components/contexts/event-form-context'
import AnimatedInputLabel from '~/components/forms/animated-input-label'
import DeleteConfirmation from '~/components/forms/delete-confirmation'
import DateInput from '~/components/forms/event/date-input'
import TimeSelections from '~/components/forms/event/time-selections'
import SidePaneWrapper from '~/components/forms/wrapper'
import { useEventFormActions } from '~/components/hooks/forms/useEventFormActions'
import {
  type EditingLanguage,
  LanguageSwitch,
  ReferenceNote,
} from '~/components/i18n/editing-language'

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
  allowTagAlongs: false,
}

export default function EventForm({ prefillFormData }: EventFormProps) {
  const isEditMode = !!prefillFormData
  const toggleEventForm = useToggleEventForm()

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false)
  // Name, venue, attire and description can also be written in Spanish.
  const [language, setLanguage] = useState<EditingLanguage>('en')
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

  const spanish = eventFormData.translations?.es ?? {}
  const handleSpanishChange = ({ field, inputValue }: { field: string; inputValue: string }) => {
    setEventFormData((prev) => ({
      ...prev,
      translations: { es: { ...prev.translations?.es, [field]: inputValue || undefined } },
    }))
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
        <div className='flex justify-between border-b p-5'>
          <h1 className='font-semibold text-xl'>{isEditMode ? 'Edit Event' : 'Add Event'}</h1>
          <button
            type='button'
            aria-label='Close event form'
            onClick={() => toggleEventForm()}
            className='rounded-md text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          >
            <IoMdClose size={25} />
          </button>
        </div>
        <div className='p-5'>
          <div className='mb-3 flex items-center justify-between gap-3'>
            <h2 className='font-semibold text-xl'>Event Information</h2>
            <LanguageSwitch value={language} onChange={setLanguage} label='Editing language' />
          </div>
          {language === 'es' ? (
            <div className='space-y-5'>
              <p className='text-muted-foreground text-xs'>
                Spanish text for Spanish-speaking guests. Blank fields show the English. Date and
                times are shared.
              </p>
              {(
                [
                  ['name', 'Nombre del evento', eventFormData.eventName],
                  ['venue', 'Lugar', eventFormData.venue],
                  ['attire', 'Vestimenta', eventFormData.attire],
                  ['description', 'Descripción', eventFormData.description],
                ] as const
              ).map(([field, label, english]) => (
                <div key={field} className='space-y-1'>
                  <AnimatedInputLabel
                    id={`event-${field}-es`}
                    inputValue={spanish[field] ?? ''}
                    fieldName={field}
                    // Matches the server limit on event names.
                    maxLength={field === 'name' ? 50 : undefined}
                    labelText={label}
                    handleOnChange={handleSpanishChange}
                  />
                  {english ? <ReferenceNote reference={english} /> : null}
                </div>
              ))}
            </div>
          ) : null}
          <div
            className={`grid grid-cols-1 grid-rows-[repeat(6,50px)] gap-5 ${language === 'es' ? 'hidden' : ''}`}
          >
            <AnimatedInputLabel
              id='event-name'
              inputValue={eventFormData.eventName}
              fieldName='eventName'
              labelText='Event Name*'
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
              id='event-venue'
              inputValue={eventFormData.venue ?? ''}
              fieldName='venue'
              labelText='Venue Name'
              handleOnChange={handleOnChange}
            />
            <AnimatedInputLabel
              id='event-attire'
              inputValue={eventFormData.attire ?? ''}
              fieldName='attire'
              labelText='Attire'
              handleOnChange={handleOnChange}
            />
            <AnimatedInputLabel
              id='event-description'
              inputValue={eventFormData.description ?? ''}
              fieldName='description'
              labelText='Description'
              handleOnChange={handleOnChange}
            />
          </div>
          <label
            htmlFor='allowTagAlongs'
            className='mt-5 flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/50 p-4'
          >
            <input
              id='allowTagAlongs'
              type='checkbox'
              checked={eventFormData.allowTagAlongs ?? false}
              onChange={(e) =>
                setEventFormData((prev) => ({
                  ...prev,
                  allowTagAlongs: e.target.checked,
                }))
              }
              className='mt-0.5 h-4 w-4 rounded border-gray-300'
            />
            <div>
              <span className='font-medium text-sm'>Allow tag-alongs to be invited</span>
              <p className='text-muted-foreground text-xs'>
                Tag-alongs (babies, children, etc.) can be invited and RSVP for this event
              </p>
            </div>
          </label>
        </div>
        <div
          className={`fixed bottom-0 flex ${sharedStyles.sidebarFormWidth} flex-col gap-3 border-t px-8 py-5`}
        >
          <div className='flex gap-5'>
            <button
              type='button'
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
              id='save-event'
              type='submit'
              name='save-event'
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
              type='button'
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
