import { AiOutlinePlusCircle } from 'react-icons/ai'

import { sharedStyles } from '~/app/utils/shared-styles'
import { type EventWithResponses } from '~/app/utils/shared-types'

export default function NoQuestionsView({
  event,
  onAddQuestion,
}: {
  event: EventWithResponses
  onAddQuestion: (eventId: string) => void
}) {
  const { attending, invited, declined } = event.guestResponses
  const numGuests = attending + invited + declined
  return (
    <div className="flex flex-col gap-3 border-2 border-dashed p-5">
      <b>Need to collect additional guest info?</b>
      <p>
        Add questions that all {numGuests} guest(s) on your{' '}
        <b className="underline">{event.name}</b> list will see when they RSVP &apos;Yes!&apos; on
        your Website.
      </p>
      <div
        className="flex w-fit cursor-pointer gap-2 pt-2 decoration-pink-400 hover:underline"
        onClick={() => onAddQuestion(event.id)}
      >
        <AiOutlinePlusCircle size={25} color={sharedStyles.primaryColorHex} />
        <span className={`text-${sharedStyles.primaryColor}`}>Add a Follow-Up Question</span>
      </div>
    </div>
  )
}
