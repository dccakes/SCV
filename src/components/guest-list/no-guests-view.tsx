import type { Dispatch, SetStateAction } from 'react'
import { useToggleGuestForm } from '~/components/contexts/guest-form-context'
import type { HouseholdFormData } from '~/components/forms/guest-form.schema'
import { Button } from '~/components/ui/button'

type NoGuestsViewProps = {
  setPrefillHousehold: Dispatch<SetStateAction<HouseholdFormData | undefined>>
  onImportClick: () => void
}

export default function NoGuestsView({ setPrefillHousehold, onImportClick }: NoGuestsViewProps) {
  const toggleGuestForm = useToggleGuestForm()

  return (
    <div className='flex flex-col items-center gap-6 py-16 text-center'>
      <div className='flex h-16 w-16 items-center justify-center rounded-full border border-border/80 bg-muted/50'>
        <span className='text-2xl opacity-50' aria-hidden='true'>
          ◉
        </span>
      </div>
      <div className='max-w-sm'>
        <p className='font-serif text-xl text-foreground'>No guests yet</p>
        <p className='mt-2 font-mono text-[0.65rem] text-foreground/55 leading-relaxed tracking-wider'>
          Add guests one by one or import from a CSV. Track RSVPs, contact details, and household
          information all in one place.
        </p>
      </div>
      <div className='flex flex-wrap items-center justify-center gap-3'>
        <Button
          type='button'
          variant='outline'
          onClick={onImportClick}
          className='font-mono text-[0.65rem] uppercase tracking-widest'
        >
          Import from CSV
        </Button>
        <Button
          type='button'
          onClick={() => {
            setPrefillHousehold(undefined)
            toggleGuestForm()
          }}
          className='font-mono text-[0.65rem] uppercase tracking-widest'
        >
          Add your first guest
        </Button>
      </div>
    </div>
  )
}
