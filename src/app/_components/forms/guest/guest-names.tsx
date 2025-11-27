import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form'
import { FiMinusCircle } from 'react-icons/fi'

import { type HouseholdFormData } from '~/app/_components/forms/guest-form.schema'
import { sharedStyles } from '~/app/utils/shared-styles'
import { type Event } from '~/app/utils/shared-types'

type GuestNameFormProps = {
  events: Event[]
  guestIndex: number
  control: Control<HouseholdFormData>
  register: UseFormRegister<HouseholdFormData>
  errors: FieldErrors<HouseholdFormData>
  handleRemoveGuest: (index: number) => void
  setValue: UseFormSetValue<HouseholdFormData>
}

export const GuestNameForm = ({
  events,
  guestIndex,
  control,
  register,
  errors,
  handleRemoveGuest,
  setValue,
}: GuestNameFormProps) => {
  // Get field-level errors for this guest
  const guestErrors = errors.guestParty?.[guestIndex]

  // Watch the guest party array to know how many guests exist
  const guestParty = useWatch({
    control,
    name: 'guestParty',
  })

  const handlePrimaryContactChange = (checked: boolean) => {
    if (checked && guestParty) {
      // Uncheck all other guests
      guestParty.forEach((_, index) => {
        if (index !== guestIndex) {
          setValue(`guestParty.${index}.isPrimaryContact`, false)
        }
      })
    }
  }

  return (
    <div>
      <div className="p-5">
        <h2 className="mb-3 text-2xl font-bold">Guest Name</h2>
        <div className="flex items-center justify-between gap-3">
          <div className="w-1/2">
            <div className="relative">
              <input
                id={`guest${guestIndex}-firstName`}
                {...register(`guestParty.${guestIndex}.firstName`)}
                className={`peer w-full rounded-lg border p-3 ${
                  guestErrors?.firstName ? 'border-red-500' : 'border-gray-300'
                } focus:border-blue-500 focus:outline-none`}
                placeholder=" "
              />
              <label
                htmlFor={`guest${guestIndex}-firstName`}
                className="absolute left-3 top-3 -translate-y-6 transform bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-focus:-translate-y-6 peer-focus:text-sm peer-focus:text-blue-500"
              >
                First Name*
              </label>
            </div>
            {guestErrors?.firstName && (
              <p className="mt-1 text-sm text-red-600">{guestErrors.firstName.message}</p>
            )}
          </div>

          <div className="w-1/2">
            <div className="relative">
              <input
                id={`guest${guestIndex}-lastName`}
                {...register(`guestParty.${guestIndex}.lastName`)}
                className={`peer w-full rounded-lg border p-3 ${
                  guestErrors?.lastName ? 'border-red-500' : 'border-gray-300'
                } focus:border-blue-500 focus:outline-none`}
                placeholder=" "
              />
              <label
                htmlFor={`guest${guestIndex}-lastName`}
                className="absolute left-3 top-3 -translate-y-6 transform bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-focus:-translate-y-6 peer-focus:text-sm peer-focus:text-blue-500"
              >
                Last Name*
              </label>
            </div>
            {guestErrors?.lastName && (
              <p className="mt-1 text-sm text-red-600">{guestErrors.lastName.message}</p>
            )}
          </div>

          {guestIndex > 0 && (
            <div className="cursor-pointer" onClick={() => handleRemoveGuest(guestIndex)}>
              <FiMinusCircle size={28} color="gray" />
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          <div className="w-1/2">
            <div className="relative">
              <input
                id={`guest${guestIndex}-email`}
                {...register(`guestParty.${guestIndex}.email`)}
                type="email"
                className={`peer w-full rounded-lg border p-3 ${
                  guestErrors?.email ? 'border-red-500' : 'border-gray-300'
                } focus:border-blue-500 focus:outline-none`}
                placeholder=" "
              />
              <label
                htmlFor={`guest${guestIndex}-email`}
                className="absolute left-3 top-3 -translate-y-6 transform bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-focus:-translate-y-6 peer-focus:text-sm peer-focus:text-blue-500"
              >
                Email
              </label>
            </div>
            {guestErrors?.email && (
              <p className="mt-1 text-sm text-red-600">{guestErrors.email.message}</p>
            )}
          </div>

          <div className="w-1/2">
            <div className="relative">
              <input
                id={`guest${guestIndex}-phone`}
                {...register(`guestParty.${guestIndex}.phone`)}
                className={`peer w-full rounded-lg border p-3 ${
                  guestErrors?.phone ? 'border-red-500' : 'border-gray-300'
                } focus:border-blue-500 focus:outline-none`}
                placeholder=" "
              />
              <label
                htmlFor={`guest${guestIndex}-phone`}
                className="absolute left-3 top-3 -translate-y-6 transform bg-white px-1 text-sm text-gray-600 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:text-base peer-focus:-translate-y-6 peer-focus:text-sm peer-focus:text-blue-500"
              >
                Phone
              </label>
            </div>
            {guestErrors?.phone && (
              <p className="mt-1 text-sm text-red-600">{guestErrors.phone.message}</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Controller
            name={`guestParty.${guestIndex}.isPrimaryContact`}
            control={control}
            render={({ field }) => (
              <>
                <input
                  type="checkbox"
                  id={`guest${guestIndex}-isPrimaryContact`}
                  checked={field.value ?? false}
                  onChange={(e) => {
                    const checked = e.target.checked
                    field.onChange(checked)
                    // When checking this guest as primary, uncheck all others
                    handlePrimaryContactChange(checked)
                  }}
                  className="h-5 w-5 cursor-pointer"
                  style={{ accentColor: sharedStyles.primaryColorHex }}
                />
                <label
                  htmlFor={`guest${guestIndex}-isPrimaryContact`}
                  className="cursor-pointer text-sm"
                >
                  Primary Contact
                </label>
              </>
            )}
          />
        </div>
      </div>

      <div className="p-5">
        <h3 className="mb-3 text-gray-400">Invite to the following events:</h3>
        <div className="grid grid-cols-2 gap-3">
          {events?.map((event: Event) => (
            <div key={event.id}>
              <div className="flex items-center gap-3 pr-2">
                <Controller
                  name={`guestParty.${guestIndex}.invites.${event.id}`}
                  control={control}
                  render={({ field }) => (
                    <>
                      <input
                        className="h-6 w-6 cursor-pointer border p-3"
                        style={{ accentColor: sharedStyles.primaryColorHex }}
                        type="checkbox"
                        id={`guest${guestIndex}: ${event.id}`}
                        checked={['Invited', 'Attending', 'Declined'].includes(field.value ?? '')}
                        onChange={(e) => {
                          field.onChange(e.target.checked ? 'Invited' : 'Not Invited')
                        }}
                      />
                      <label
                        className={`cursor-pointer ${sharedStyles.ellipsisOverflow}`}
                        htmlFor={`guest${guestIndex}: ${event.id}`}
                      >
                        {event.name}
                      </label>
                    </>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
