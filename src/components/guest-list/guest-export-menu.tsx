'use client'

import { ChevronDown, Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { downloadCsv, slugify } from '~/lib/download-csv'
import { buildEventGuestCsv, buildGuestListCsv } from '~/lib/guest-export/guest-export-csv'
import { api } from '~/trpc/react'

type GuestExportMenuProps = {
  events: ReadonlyArray<{ id: string; name: string }>
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Downloads the guest list as CSV: the whole wedding, or one event for a
 * caterer or venue. Always exports every guest, ignoring list filters, so a
 * file is never silently partial.
 */
export function GuestExportMenu({ events }: Readonly<GuestExportMenuProps>) {
  const utils = api.useUtils()
  const [isExporting, setIsExporting] = useState(false)

  const exportCsv = async (eventId?: string) => {
    setIsExporting(true)
    try {
      // Always read fresh data so recent RSVPs are included
      const data = await utils.guest.getExportData.fetch(undefined, { staleTime: 0 })
      if (eventId) {
        const eventName = events.find((event) => event.id === eventId)?.name ?? 'event'
        downloadCsv(
          `guests-${slugify(eventName, 'event')}-${today()}.csv`,
          buildEventGuestCsv(data, eventId)
        )
      } else {
        downloadCsv(`guest-list-${today()}.csv`, buildGuestListCsv(data))
      }
    } catch {
      toast.error('Could not export the guest list. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type='button' variant='outline' disabled={isExporting}>
          <Download className='mr-2 h-4 w-4' aria-hidden='true' />
          {isExporting ? 'Exporting...' : 'Export'}
          <ChevronDown className='ml-2 h-4 w-4' aria-hidden='true' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64'>
        <DropdownMenuItem onSelect={() => void exportCsv()}>
          <div className='flex flex-col'>
            <span>All guests</span>
            <span className='text-muted-foreground text-xs'>
              Contacts, addresses, every RSVP and answer
            </span>
          </div>
        </DropdownMenuItem>
        {events.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className='font-normal text-muted-foreground text-xs'>
              One event, for caterers and venues
            </DropdownMenuLabel>
            {events.map((event) => (
              <DropdownMenuItem key={event.id} onSelect={() => void exportCsv(event.id)}>
                {event.name}
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
