import Link from 'next/link'

import { useToggleEventForm } from '~/app/_components/contexts/event-form-context'
import { sharedStyles } from '~/app/utils/shared-styles'
import { type Event } from '~/app/utils/shared-types'

type EventsTabsProps = {
  events: Event[]
  selectedEventId: string
}

export default function EventsTabs({ events, selectedEventId }: EventsTabsProps) {
  const toggleEventForm = useToggleEventForm()

  return (
    <>
      <ul className="flex gap-5">
        <li
          className={`cursor-pointer border-b-4 py-3 text-sm hover:border-gray-600 ${
            selectedEventId === 'all' ? 'border-gray-600' : 'border-transparent'
          }`}
        >
          <Link href="?event=all" scroll={false}>
            All Events
          </Link>
        </li>
        {events?.map((event) => {
          return (
            <li
              className={`cursor-pointer border-b-4 py-3 text-sm hover:border-gray-600 ${
                selectedEventId === event.id ? 'border-gray-600' : 'border-transparent'
              }`}
              key={event.id}
            >
              <Link href={`?event=${event.id}`} scroll={false}>
                {event.name}
              </Link>
            </li>
          )
        })}
        <button
          className={`pb-1 text-sm font-semibold text-${sharedStyles.primaryColor}`}
          onClick={() => toggleEventForm()}
        >
          + New Event
        </button>
      </ul>
      <hr className="relative -left-20 bottom-0 w-screen border-gray-300" />
    </>
  )
}
