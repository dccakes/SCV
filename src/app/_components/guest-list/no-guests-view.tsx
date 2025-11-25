import { type Dispatch, type SetStateAction } from 'react'

import { useToggleGuestForm } from '~/app/_components/contexts/guest-form-context'
import ExampleTable from '~/app/_components/guest-list/example-table'
import { sharedStyles } from '~/app/utils/shared-styles'
import { type HouseholdFormData } from '~/app/utils/shared-types'

type NoGuestsViewProps = {
  setPrefillHousehold: Dispatch<SetStateAction<HouseholdFormData | undefined>>
}

export default function NoGuestsView({ setPrefillHousehold }: NoGuestsViewProps) {
  const toggleGuestForm = useToggleGuestForm()
  return (
    <section className={sharedStyles.desktopPaddingSidesGuestList}>
      <div className="my-10 w-[500px] rounded-md p-8 shadow-[0_3px_10px_rgb(0,0,0,0.2)]">
        <h2 className="pb-3 text-2xl font-semibold">Add Guests to This Event</h2>
        <p>
          Simply add guests that you&apos;ve already added to other events, or add a unique guest to
          this event.
        </p>
        <div className="mt-5 flex gap-5">
          <button className={sharedStyles.primaryButton({ py: 'py-2' })}>Import Guests</button>
          <button
            className={sharedStyles.primaryButton({ py: 'py-2' })}
            onClick={() => {
              setPrefillHousehold(undefined)
              toggleGuestForm()
            }}
          >
            Add Guest
          </button>
        </div>
      </div>
      <ExampleTable />
    </section>
  )
}
