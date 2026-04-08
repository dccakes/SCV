'use client'

import { type Dispatch, type SetStateAction, useState } from 'react'
import { AiOutlineCalendar } from 'react-icons/ai'
import { IoIosCheckmarkCircleOutline } from 'react-icons/io'
import { formatDateStandard } from '~/app/utils/helpers'
import type { Event, Guest, RsvpFormResponse, StepFormProps } from '~/app/utils/shared-types'
import { useRsvpForm, useUpdateRsvpForm } from '~/components/contexts/rsvp-form-context'

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

  // Pre-populate from confirmedHousehold invitation status
  const getInitialRsvp = (guestId: number): 'Attending' | 'Declined' | undefined => {
    const guest = rsvpFormData.confirmedHousehold?.guests.find((g) => g.id === guestId)
    const invitation = guest?.invitations.find((i) => i.eventId === event.id)
    if (invitation?.rsvp === 'Attending' || invitation?.rsvp === 'Declined') {
      return invitation.rsvp
    }
    return undefined
  }

  const buildInitialResponses = (): RsvpFormResponse[] =>
    invitedGuests.flatMap((guest) => {
      const initial = getInitialRsvp(guest.id)
      if (!initial) return []
      return [{ eventId: event.id, guestId: guest.id, rsvp: initial, guestName: `${guest.firstName} ${guest.lastName}` }]
    })

  const [rsvpResponses, setRsvpResponses] = useState<RsvpFormResponse[]>(buildInitialResponses)

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
                  initialRsvp={getInitialRsvp(guest.id)}
                  setRsvpResponses={setRsvpResponses}
                  guestName={`${guest.firstName} ${guest.lastName}`}
                />
              </div>
            </li>
          )
        })}
      </ul>
      <button
        className={`mt-3 py-3 text-white text-xl tracking-wide ${rsvpResponses.length < invitedGuests.length ? 'cursor-not-allowed bg-stone-400' : 'bg-stone-700'}`}
        disabled={rsvpResponses.length < invitedGuests.length}
        type='button'
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
  initialRsvp?: 'Attending' | 'Declined'
  setRsvpResponses: Dispatch<SetStateAction<RsvpFormResponse[]>>
  guestName: string
}

function RsvpSelection({
  eventId,
  guestId,
  initialRsvp,
  setRsvpResponses,
  guestName,
}: RsvpSelectionProps) {
  const [rsvpSelection, setRsvpSelection] = useState<'Attending' | 'Declined' | undefined>(
    initialRsvp
  )
  const handleOnSelect = (selection: 'Attending' | 'Declined', currentGuestId: number) => {
    setRsvpSelection(selection)
    setRsvpResponses((prev) => {
      const existing = prev.find((r) => r.guestId === currentGuestId)
      if (existing === undefined) {
        return [...prev, { eventId, guestId, rsvp: selection, guestName }]
      }
      return prev.map((r) =>
        r.guestId === currentGuestId ? { ...r, rsvp: selection } : r
      )
    })
  }
  return (
    <div className='flex gap-3'>
      <button
        type='button'
        className={`flex w-32 cursor-pointer items-center justify-center gap-1 border border-stone-400 py-2 ${rsvpSelection === 'Attending' ? 'bg-stone-700 text-white' : 'text-stone-400'}`}
        onClick={() => handleOnSelect('Attending', guestId)}
      >
        {rsvpSelection === 'Attending' && <IoIosCheckmarkCircleOutline size={20} />}
        Accept{rsvpSelection === 'Attending' && 'ed'}
      </button>
      <button
        type='button'
        className={`flex w-32 cursor-pointer items-center justify-center gap-1 border border-stone-400 py-2 ${rsvpSelection === 'Declined' ? 'bg-stone-700 text-white' : 'text-stone-400'}`}
        onClick={() => handleOnSelect('Declined', guestId)}
      >
        {rsvpSelection === 'Declined' && <IoIosCheckmarkCircleOutline size={20} />}
        Decline{rsvpSelection === 'Declined' && 'd'}
      </button>
    </div>
  )
}
