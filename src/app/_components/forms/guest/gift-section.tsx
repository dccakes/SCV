import { type Dispatch, type SetStateAction } from 'react'

import { sharedStyles } from '~/app/utils/shared-styles'
import { type HouseholdFormData } from '~/app/utils/shared-types'

type GiftSectionProps = {
  setHouseholdFormData: Dispatch<SetStateAction<HouseholdFormData>>
  householdFormData: HouseholdFormData
}

export default function GiftSection({ householdFormData, setHouseholdFormData }: GiftSectionProps) {
  const handleOnChange = (key: string, value: boolean | string, updatedEvent: string) => {
    setHouseholdFormData((prev) => {
      return {
        ...prev,
        gifts: prev.gifts?.map((gift) => {
          if (gift.eventId === updatedEvent) {
            return {
              ...gift,
              [key]: value,
            }
          }
          return gift
        }),
      }
    })
  }

  return (
    <>
      <h2 className="my-4 text-2xl font-bold">Gifts</h2>
      {householdFormData.gifts?.map((gift) => {
        return (
          <div key={gift.eventId} className="mb-6">
            <h3 className="mb-3 text-lg font-semibold">{gift.event?.name}</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <input
                  className="h-6 w-6 cursor-pointer border p-3"
                  style={{ accentColor: sharedStyles.primaryColorHex }}
                  type="checkbox"
                  id={`thank-you-event: ${gift.eventId}`}
                  onChange={(e) => handleOnChange('thankyou', e.target.checked, gift.eventId)}
                  checked={gift.thankyou}
                />
                <label
                  className={`cursor-pointer ${sharedStyles.ellipsisOverflow}`}
                  htmlFor={`thank-you-event: ${gift.eventId}`}
                >
                  Thank You Sent
                </label>
              </div>
              <input
                placeholder="Gift Received"
                className="w-[100%] border p-3"
                value={gift.description ?? ''}
                onChange={(e) => handleOnChange('description', e.target.value, gift.eventId)}
              />
            </div>
          </div>
        )
      })}
    </>
  )
}
