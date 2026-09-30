import Link from 'next/link'
import type { Event } from '~/app/utils/shared-types'
import { useToggleEventForm } from '~/components/contexts/event-form-context'
import { Button } from '~/components/ui/button'

type EventsTabsProps = {
  events: Event[]
  selectedEventId: string
}

export default function EventsTabs({ events, selectedEventId }: EventsTabsProps) {
  const toggleEventForm = useToggleEventForm()

  return (
    <>
      <ul className='flex items-center gap-5'>
        <li>
          <Link
            role='tab'
            aria-selected={selectedEventId === 'all'}
            href='?event=all'
            scroll={false}
            className={`block cursor-pointer border-b-2 py-3 text-sm transition-colors hover:border-foreground ${
              selectedEventId === 'all'
                ? 'border-foreground font-medium'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            All Events
          </Link>
        </li>
        {events?.map((event) => (
          <li key={event.id}>
            <Link
              role='tab'
              aria-selected={selectedEventId === event.id}
              href={`?event=${event.id}`}
              scroll={false}
              className={`block cursor-pointer border-b-2 py-3 text-sm transition-colors hover:border-foreground ${
                selectedEventId === event.id
                  ? 'border-foreground font-medium'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              {event.name}
            </Link>
          </li>
        ))}
        <li>
          <Button
            variant='ghost'
            size='sm'
            className='text-primary'
            onClick={() => toggleEventForm()}
          >
            + New Event
          </Button>
        </li>
      </ul>
      <div className='border-border border-t' />
    </>
  )
}
