import Link from 'next/link'

import { useToggleEventForm } from '~/app/_components/contexts/event-form-context'
import { type Event } from '~/app/utils/shared-types'
import { Button } from '~/components/ui/button'

type EventsTabsProps = {
  events: Event[]
  selectedEventId: string
}

export default function EventsTabs({ events, selectedEventId }: EventsTabsProps) {
  const toggleEventForm = useToggleEventForm()

  return (
    <>
      <ul className="flex items-center gap-5">
        <li
          className={`cursor-pointer border-b-2 py-3 text-sm transition-colors hover:border-foreground ${
            selectedEventId === 'all'
              ? 'border-foreground font-medium'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          <Link href="?event=all" scroll={false}>
            All Events
          </Link>
        </li>
        {events?.map((event) => {
          return (
            <li
              className={`cursor-pointer border-b-2 py-3 text-sm transition-colors hover:border-foreground ${
                selectedEventId === event.id
                  ? 'border-foreground font-medium'
                  : 'border-transparent text-muted-foreground'
              }`}
              key={event.id}
            >
              <Link href={`?event=${event.id}`} scroll={false}>
                {event.name}
              </Link>
            </li>
          )
        })}
        <Button
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() => toggleEventForm()}
        >
          + New Event
        </Button>
      </ul>
      <hr className="relative -left-20 bottom-0 w-screen border" />
    </>
  )
}
