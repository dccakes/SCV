'use client'

import { TRPCClientError } from '@trpc/client'
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
import { downloadCsv, localDateStamp, slugify } from '~/lib/download-csv'
import {
  buildEventGuestCsv,
  buildGuestListCsv,
  summarizeEventExport,
} from '~/lib/guest-export/guest-export-csv'
import { api } from '~/trpc/react'

type GuestExportMenuProps = {
  events: ReadonlyArray<{ id: string; name: string }>
  /** Every guest in the wedding, ignoring list filters */
  guestCount: number
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

const exportErrorMessage = (error: unknown): string =>
  error instanceof TRPCClientError && error.data?.code === 'FORBIDDEN'
    ? 'You do not have permission to export the guest list.'
    : 'Could not export the guest list. Please try again.'

/**
 * Downloads the guest list as CSV: the whole wedding, or one event for a
 * caterer or venue. Always exports every guest, ignoring list filters, so a
 * file is never silently partial.
 */
export function GuestExportMenu({ events, guestCount }: Readonly<GuestExportMenuProps>) {
  const utils = api.useUtils()
  const [isExporting, setIsExporting] = useState(false)
  const hasGuests = guestCount > 0

  const exportCsv = async (eventId?: string) => {
    setIsExporting(true)
    try {
      // Always read fresh data so recent RSVPs are included
      const data = await utils.guest.getExportData.fetch(undefined, { staleTime: 0 })
      if (eventId) {
        const eventName = events.find((event) => event.id === eventId)?.name ?? 'event'
        const fileName = `guests-${slugify(eventName, 'event')}-${localDateStamp()}.csv`
        downloadCsv(fileName, buildEventGuestCsv(data, eventId))
        const { invited, attending } = summarizeEventExport(data, eventId)
        toast.success(`Downloaded ${fileName}`, {
          description: `${plural(invited, 'invited guest')}, ${attending} attending`,
        })
      } else {
        const fileName = `guest-list-${localDateStamp()}.csv`
        downloadCsv(fileName, buildGuestListCsv(data))
        toast.success(`Downloaded ${fileName}`, {
          description: plural(data.guests.length, 'guest'),
        })
      }
    } catch (error) {
      toast.error(exportErrorMessage(error))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          variant='outline'
          disabled={isExporting || !hasGuests}
          title={hasGuests ? undefined : 'No guests to export yet'}
        >
          <Download className='mr-2 h-4 w-4' aria-hidden='true' />
          {isExporting ? 'Exporting...' : 'Export'}
          <ChevronDown className='ml-2 h-4 w-4' aria-hidden='true' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-72'>
        <DropdownMenuItem onSelect={() => void exportCsv()}>
          <div className='flex flex-col'>
            <span>All guests</span>
            <span className='text-muted-foreground text-xs'>
              All {plural(guestCount, 'guest')} with contacts, addresses, RSVPs and answers. Filters
              are ignored.
            </span>
          </div>
        </DropdownMenuItem>
        {events.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className='font-normal text-muted-foreground text-xs'>
              For one event, to share with caterers and venues (no contact details)
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
