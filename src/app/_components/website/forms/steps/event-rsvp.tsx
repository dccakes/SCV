'use client'

import { useState } from 'react'
import { type Dispatch, type SetStateAction } from 'react'
import { AiOutlineCalendar } from 'react-icons/ai'
import { IoIosCheckmarkCircleOutline } from 'react-icons/io'

import { useRsvpForm, useUpdateRsvpForm } from '~/app/_components/contexts/rsvp-form-context'
import { formatDateStandard } from '~/app/utils/helpers'
import {
  type Event,
  type Guest,
  type RsvpFormResponse,
  type StepFormProps,
} from '~/app/utils/shared-types'

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
  const [rsvpResponses, setRsvpResponses] = useState<RsvpFormResponse[]>([])

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-2xl tracking-widest">{event.name}</h2>
      {!!event.date && (
        <div className="flex gap-2">
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
            <li key={guest.id} className="mb-3">
              <div className="flex items-center justify-between">
                <span>
                  {guest.firstName} {guest.lastName}
                </span>
                <RsvpSelection
                  eventId={event.id}
                  guestId={guest.id}
                  setRsvpResponses={setRsvpResponses}
                  guestName={`${guest.firstName} ${guest.lastName}`}
                />
              </div>
            </li>
          )
        })}
      </ul>
      <button
        className={`mt-3 py-3 text-xl tracking-wide text-white ${rsvpResponses.length < invitedGuests.length ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
        disabled={rsvpResponses.length < invitedGuests.length}
        type="button"
        onClick={() => {
          updateRsvpForm({
            rsvpResponses: [...rsvpFormData.rsvpResponses, ...rsvpResponses],
          })
          goNext?.()
        }}
      >
        CONTINUE
      </button>
      <button
        className={`mt-3 bg-gray-700 py-3 text-xl tracking-wide text-white`}
        type="submit"
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
  setRsvpResponses: Dispatch<SetStateAction<RsvpFormResponse[]>>
  guestName: string
}

function RsvpSelection({ eventId, guestId, setRsvpResponses, guestName }: RsvpSelectionProps) {
  const [rsvpSelection, setRsvpSelection] = useState<'Attending' | 'Declined'>()
  const handleOnSelect = (rsvpSelection: 'Attending' | 'Declined', currentGuestId: number) => {
    setRsvpSelection(rsvpSelection)
    setRsvpResponses((prev) => {
      const rsvpResponse = prev.find((response) => response.guestId === currentGuestId)
      if (rsvpResponse === undefined) {
        return [...prev, { eventId, guestId, rsvp: rsvpSelection, guestName }]
      }
      return prev.map((response) =>
        response.guestId === currentGuestId ? { ...response, rsvp: rsvpSelection } : response
      )
    })
  }
  return (
    <div className="flex gap-3">
      <div
        className={`flex w-32 cursor-pointer items-center justify-center gap-1 border border-stone-400 py-2 ${rsvpSelection === 'Attending' ? 'bg-stone-700 text-white' : 'text-stone-400'}`}
        onClick={() => handleOnSelect('Attending', guestId)}
      >
        {rsvpSelection === 'Attending' && <IoIosCheckmarkCircleOutline size={20} />}
        Accept{rsvpSelection === 'Attending' && 'ed'}
      </div>
      <div
        className={`flex w-32 cursor-pointer items-center justify-center gap-1 border border-stone-400 py-2 ${rsvpSelection === 'Declined' ? 'bg-stone-700 text-white' : 'text-stone-400'}`}
        onClick={() => handleOnSelect('Declined', guestId)}
      >
        {rsvpSelection === 'Declined' && <IoIosCheckmarkCircleOutline size={20} />}
        Decline{rsvpSelection === 'Declined' && 'd'}
      </div>
    </div>
  )
}
