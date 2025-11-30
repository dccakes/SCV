import { type Dispatch, type SetStateAction } from 'react'

import { useToggleGuestForm } from '~/app/_components/contexts/guest-form-context'
import { type HouseholdFormData } from '~/app/_components/forms/guest-form.schema'
import ExampleTable from '~/app/_components/guest-list/example-table'
import { sharedStyles } from '~/app/utils/shared-styles'
import { Button } from '~/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'

type NoGuestsViewProps = {
  setPrefillHousehold: Dispatch<SetStateAction<HouseholdFormData | undefined>>
}

export default function NoGuestsView({ setPrefillHousehold }: NoGuestsViewProps) {
  const toggleGuestForm = useToggleGuestForm()
  return (
    <section className={sharedStyles.desktopPaddingSidesGuestList}>
      <Card className="my-10 w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Add Guests to This Event</CardTitle>
          <CardDescription>
            Simply add guests that you&apos;ve already added to other events, or add a unique guest
            to this event.
          </CardDescription>
        </CardHeader>
        <CardFooter className="gap-4">
          <Button variant="outline">Import Guests</Button>
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
