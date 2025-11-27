import {
  type Control,
  Controller,
  type FieldErrors,
  useFieldArray,
  type UseFormRegister,
} from 'react-hook-form'

import { type HouseholdFormData } from '~/app/_components/forms/guest-form.schema'
import { sharedStyles } from '~/app/utils/shared-styles'
import { type Event } from '~/app/utils/shared-types'

type GiftSectionProps = {
  control: Control<HouseholdFormData>
  register: UseFormRegister<HouseholdFormData>
  errors: FieldErrors<HouseholdFormData>
  events: Event[]
}

export default function GiftSection({ control, register, errors, events }: GiftSectionProps) {
  const { fields } = useFieldArray({
    control,
    name: 'gifts',
  })

  return (
    <>
      <h2 className="my-4 text-2xl font-bold">Gifts</h2>
      {fields.map((field, index) => {
        // Look up event name by eventId
        const event = events.find((e) => e.id === field.eventId)
        const eventName = event?.name ?? `Event ${index + 1}`
        const giftErrors = errors.gifts?.[index]

        return (
          <div key={field.id} className="mb-6">
            <h3 className="mb-3 text-lg font-semibold">{eventName}</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Controller
                  name={`gifts.${index}.thankyou`}
                  control={control}
                  render={({ field: controllerField }) => (
                    <>
                      <input
                        className="h-6 w-6 cursor-pointer border p-3"
                        style={{ accentColor: sharedStyles.primaryColorHex }}
                        type="checkbox"
                        id={`thank-you-event: ${field.eventId}`}
                        checked={controllerField.value ?? false}
                        onChange={(e) => controllerField.onChange(e.target.checked)}
                      />
                      <label
                        className={`cursor-pointer ${sharedStyles.ellipsisOverflow}`}
                        htmlFor={`thank-you-event: ${field.eventId}`}
                      >
                        Thank You Sent
                      </label>
                    </>
                  )}
                />
              </div>

              <div>
                <input
                  {...register(`gifts.${index}.description`)}
                  placeholder="Gift Received"
                  className={`w-[100%] rounded-lg border p-3 ${
                    giftErrors?.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {giftErrors?.description && (
                  <p className="mt-1 text-sm text-red-600">{giftErrors.description.message}</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}
