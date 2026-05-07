'use client'

import { useMemo, useState } from 'react'
import { AiOutlineCalendar } from 'react-icons/ai'
import { IoIosCheckmarkCircleOutline } from 'react-icons/io'
import { formatDateStandard } from '~/app/utils/helpers'
import type { Event, Guest, RsvpFormResponse, StepFormProps } from '~/app/utils/shared-types'
import { useRsvpForm, useUpdateRsvpForm } from '~/components/contexts/rsvp-form-context'
import { upsertRsvpResponses } from '~/components/website/forms/rsvp-state'

interface EventRsvpFormProps extends StepFormProps {
  event: Event
  invitedGuests: Guest[]
}

export default function EventRsvpForm({
  goNext,
  goBack,
  event,
  invitedGuests,
}: EventRsvpFormProps) {
  const rsvpFormData = useRsvpForm()
  const updateRsvpForm = useUpdateRsvpForm()
  const existingResponsesForEvent = useMemo(() => {
    return rsvpFormData.rsvpResponses.filter((response) => response.eventId === event.id)
  }, [rsvpFormData.rsvpResponses, event.id])
  const [rsvpResponsesByGuestId, setRsvpResponsesByGuestId] = useState<
    Record<number, RsvpFormResponse>
  >(() => {
    // Pre-populate from confirmedHousehold (prior RSVP data), then overlay any already-entered form responses
    const fromHousehold: Record<number, RsvpFormResponse> = {}
    if (rsvpFormData.confirmedHousehold) {
      for (const guest of rsvpFormData.confirmedHousehold.guests) {
        const invitation = guest.invitations.find((i) => i.eventId === event.id)
        if (invitation?.rsvp === 'Attending' || invitation?.rsvp === 'Declined') {
          fromHousehold[guest.id] = {
            eventId: event.id,
            guestId: guest.id,
            guestName: `${guest.firstName} ${guest.lastName}`,
            rsvp: invitation.rsvp,
          }
        }
      }
    }
    return existingResponsesForEvent.reduce<Record<number, RsvpFormResponse>>((acc, response) => {
      acc[response.guestId] = response
      return acc
    }, fromHousehold)
  })
  const eventResponses = invitedGuests
    .map((guest) => rsvpResponsesByGuestId[guest.id])
    .filter((response): response is RsvpFormResponse => response !== undefined)
  const hasAnsweredAllGuests = eventResponses.length === invitedGuests.length

  return (
    <div className='flex flex-col gap-5'>
      <h2 className='text-2xl tracking-widest'>{event.name}</h2>
      {!!event.date && (
        <div className='flex gap-2'>
          <AiOutlineCalendar size={20} />
          <span>
            {formatDateStandard(event.date)}
            {event.startTime && ` at ${event.startTime}`}
          </span>
        </div>
      )}
      <ul>
        {invitedGuests.map((guest) => {
          return (
            <li key={guest.id} className='mb-3'>
              <div className='flex items-center justify-between'>
                <span>
                  {guest.firstName} {guest.lastName}
                </span>
                <RsvpSelection
                  eventId={event.id}
                  guestId={guest.id}
                  guestName={`${guest.firstName} ${guest.lastName}`}
                  response={rsvpResponsesByGuestId[guest.id]}
                  onSelect={(response) => {
                    setRsvpResponsesByGuestId((prev) => ({
                      ...prev,
                      [response.guestId]: response,
                    }))
                  }}
                />
              </div>
            </li>
          )
        })}
      </ul>
      <button
        className={`mt-3 py-3 text-white text-xl tracking-wide ${!hasAnsweredAllGuests ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
        disabled={!hasAnsweredAllGuests}
        type='button'
        onClick={() => {
          updateRsvpForm({
            rsvpResponses: upsertRsvpResponses(rsvpFormData.rsvpResponses, eventResponses),
          })
          goNext?.()
        }}
      >
        CONTINUE
      </button>
      <button
        className='mt-3 bg-gray-700 py-3 text-white text-xl tracking-wide'
        type='submit'
        onClick={() => goBack?.()}
      >
        BACK
      </button>
    </div>
  )
}

type RsvpSelectionProps = {
  eventId: string
  guestId: number
  guestName: string
  response?: RsvpFormResponse
  onSelect: (response: RsvpFormResponse) => void
}

function RsvpSelection({ eventId, guestId, guestName, response, onSelect }: RsvpSelectionProps) {
  const selectedRsvp = response?.rsvp

  const handleOnSelect = (selection: 'Attending' | 'Declined') => {
    onSelect({
      eventId,
      guestId,
      guestName,
      rsvp: selection,
    })
  }

  return (
    <div className='flex gap-3'>
      <button
        type='button'
        className={`flex w-32 cursor-pointer items-center justify-center gap-1 border border-stone-400 py-2 ${selectedRsvp === 'Attending' ? 'bg-stone-700 text-white' : 'text-stone-400'}`}
        onClick={() => handleOnSelect('Attending')}
      >
        {selectedRsvp === 'Attending' && <IoIosCheckmarkCircleOutline size={20} />}
        Accept{selectedRsvp === 'Attending' && 'ed'}
      </button>
      <button
        type='button'
        className={`flex w-32 cursor-pointer items-center justify-center gap-1 border border-stone-400 py-2 ${selectedRsvp === 'Declined' ? 'bg-stone-700 text-white' : 'text-stone-400'}`}
        onClick={() => handleOnSelect('Declined')}
      >
        {selectedRsvp === 'Declined' && <IoIosCheckmarkCircleOutline size={20} />}
        Decline{selectedRsvp === 'Declined' && 'd'}
      </button>
    </div>
  )
}
