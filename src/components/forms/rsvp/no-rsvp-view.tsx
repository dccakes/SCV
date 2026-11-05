import { useCanEdit } from '~/components/contexts/workspace-capabilities-context'

export default function NoRsvpView() {
  const canEdit = useCanEdit()

  if (!canEdit) {
    return (
      <div className='my-5 border-2 border-dashed p-5 text-muted-foreground'>
        RSVPs are not being collected for this event.
      </div>
    )
  }

  return (
    <div className='my-5 border-2 border-dashed p-5'>
      <b>Toggle on &apos;Collect RSVPs&apos; if you want to gather a guest count for this event.</b>
      <br />
      Don&apos;t worry, no one will be able to RSVP until you make this page visible on your Wedding
      Website.
    </div>
  )
}
