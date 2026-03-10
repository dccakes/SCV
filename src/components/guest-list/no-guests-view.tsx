import type { Dispatch, SetStateAction } from 'react'

import { useToggleGuestForm } from '~/components/contexts/guest-form-context'
import type { HouseholdFormData } from '~/components/forms/guest-form.schema'
import { sharedStyles } from '~/app/utils/shared-styles'
import ExampleTable from '~/components/guest-list/example-table'
import { Button } from '~/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'

type NoGuestsViewProps = {
  setPrefillHousehold: Dispatch<SetStateAction<HouseholdFormData | undefined>>
  onImportClick: () => void
}

export default function NoGuestsView({ setPrefillHousehold, onImportClick }: NoGuestsViewProps) {
  const toggleGuestForm = useToggleGuestForm()
  return (
    <section className={sharedStyles.desktopPaddingSidesGuestList}>
      <Card className='my-10 w-full max-w-2xl'>
        <CardHeader>
          <CardTitle>Add Guests to This Event</CardTitle>
          <CardDescription>
            Simply add guests that you&apos;ve already added to other events, or add a unique guest
            to this event.
          </CardDescription>
        </CardHeader>
        <CardFooter className='gap-4'>
          <Button variant='outline' onClick={onImportClick}>
            Import Guests
          </Button>
          <Button
            onClick={() => {
              setPrefillHousehold(undefined)
              toggleGuestForm()
            }}
          >
            Add Guest
          </Button>
        </CardFooter>
      </Card>
      <ExampleTable />
    </section>
  )
}
