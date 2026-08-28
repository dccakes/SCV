'use client'

import { CalendarPlus } from 'lucide-react'

import { Button } from '~/components/ui/button'
import type { SaveTheDateCalendarLinks } from '~/lib/website/calendar'

/**
 * Three "save the date" buttons that add the couple's wedding weekend to the
 * guest's calendar — Google Calendar and Outlook open a pre-filled event, while
 * Apple Calendar (and any other client) downloads the `.ics` file.
 *
 * The links are precomputed on the server; only the `.ics` download needs the
 * browser, so this is a thin client component over the shared `Button`, which
 * inherits each template's theme automatically.
 */
export function AddToCalendarButtons({
  googleUrl,
  outlookUrl,
  ics,
  fileName,
}: Readonly<SaveTheDateCalendarLinks>) {
  const downloadIcs = () => {
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className='flex flex-wrap items-center justify-center gap-3'>
      <Button asChild variant='outline' size='sm'>
        <a href={googleUrl} target='_blank' rel='noopener noreferrer'>
          <CalendarPlus />
          Google Calendar
        </a>
      </Button>
      <Button asChild variant='outline' size='sm'>
        <a href={outlookUrl} target='_blank' rel='noopener noreferrer'>
          <CalendarPlus />
          Outlook
        </a>
      </Button>
      <Button type='button' variant='outline' size='sm' onClick={downloadIcs}>
        <CalendarPlus />
        Apple Calendar
      </Button>
    </div>
  )
}
