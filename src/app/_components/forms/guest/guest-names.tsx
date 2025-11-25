import { type Dispatch, type SetStateAction } from 'react'
import { FiMinusCircle } from 'react-icons/fi'

import AnimatedInputLabel from '~/app/_components/forms/animated-input-label'
import { sharedStyles } from '~/app/utils/shared-styles'
import { type Event, type GuestFormData, type HouseholdFormData } from '~/app/utils/shared-types'

type GuestNameFormProps = {
  events: Event[]
  guestIndex: number
  guest: GuestFormData
  setHouseholdFormData: Dispatch<SetStateAction<HouseholdFormData>>
  setDeletedGuests: Dispatch<SetStateAction<number[]>>
}

export const GuestNameForm = ({
  events,
  guestIndex,
  guest,
  setHouseholdFormData,
  setDeletedGuests,
}: GuestNameFormProps) => {
  const handleRemoveGuest = () => {
    setDeletedGuests((prev) => [...prev, guest.guestId ?? -1]) // for editMode, guestId will be defined - otherwise we're in add mode so dont need to delete from db
    setHouseholdFormData((prev) => ({
      ...prev,
      guestParty: prev.guestParty.filter((guest, i) => i !== guestIndex),
    }))
  }

  const handleSelectEvent = (
    e: React.ChangeEvent<HTMLInputElement>,
    event: Event,
    index: number
  ) => {
    setHouseholdFormData((prev) => {
      return {
        ...prev,
        guestParty: prev.guestParty.map((guest, i) =>
          i === index
            ? {
                ...guest,
                invites: {
                  ...guest.invites,
                  [event.id]: e.target.checked ? 'Invited' : 'Not Invited',
                },
              }
            : guest
        ),
      }
    })
  }

  const handleNameChange = ({
    field,
    inputValue,
    guestIndex,
  }: {
    field: string
    inputValue: string
    guestIndex: number
  }) => {
    setHouseholdFormData((prev) => {
      return {
        ...prev,
        guestParty: prev.guestParty.map((guest, i) =>
          i === guestIndex ? { ...guest, [field]: inputValue } : guest
        ),
      }
    })
  }

  return (
    <div>
      <div className="p-5">
        <h2 className="mb-3 text-2xl font-bold">Guest Name</h2>
        <div className="flex items-center justify-between gap-3">
          <div className="w-1/2">
            <AnimatedInputLabel
              id={`guest${guestIndex}-firstName`}
              inputValue={guest.firstName}
              fieldName="firstName"
              labelText="First Name*"
              guestIndex={guestIndex}
              required={true}
              handleOnChange={handleNameChange}
            />
          </div>
          <div className="w-1/2">
            <AnimatedInputLabel
              id={`guest${guestIndex}-lastName`}
              inputValue={guest.lastName}
              fieldName="lastName"
              labelText="Last Name*"
              guestIndex={guestIndex}
              required={true}
              handleOnChange={handleNameChange}
            />
          </div>
          {guestIndex > 0 && (
            <div className="cursor-pointer" onClick={handleRemoveGuest}>
              <FiMinusCircle size={28} color="gray" />
            </div>
          )}
        </div>
      </div>
      <div className="p-5">
        <h3 className="mb-3 text-gray-400">Invite to the following events:</h3>
        <div className="grid grid-cols-2 gap-3">
          {events?.map((event: Event) => {
            return (
              <div key={event.id}>
                <div className="flex items-center gap-3 pr-2">
                  <div className="flex items-center">
                    <input
                      className="h-6 w-6 cursor-pointer border p-3"
                      style={{ accentColor: sharedStyles.primaryColorHex }}
                      type="checkbox"
                      id={`guest${guestIndex}: ${event.id}`}
                      onChange={(e) => handleSelectEvent(e, event, guestIndex)}
                      checked={['Invited', 'Attending', 'Declined'].includes(
                        guest.invites[event.id] ?? ''
                      )}
                    />
                  </div>
                  <label
                    className={`cursor-pointer ${sharedStyles.ellipsisOverflow}`}
                    htmlFor={`guest${guestIndex}: ${event.id}`}
                  >
                    {event.name}
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
