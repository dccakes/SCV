import Image from 'next/image'
import Link from 'next/link'

import Navbar from '~/app/_components/website/navbar'
import { formatDateStandard } from '~/app/utils/helpers'
import { sharedStyles } from '~/app/utils/shared-styles'
import { type WeddingPageData } from '~/app/utils/shared-types'

type WeddingPageProps = {
  weddingData: WeddingPageData
  path: string
}

export default function WeddingPage({ weddingData, path }: WeddingPageProps) {
  return (
    <main className='flex flex-col items-center justify-center gap-20 pb-24 text-center font-["Crimson_Text"] tracking-widest text-zinc-500'>
      <div className="text-center">
        <h1 className="my-5 text-6xl font-medium tracking-widest">
          {weddingData.groomFirstName} & {weddingData.brideFirstName}
        </h1>
        <span className="text-lg">
          {weddingData.date?.standardFormat ?? 'Date To Be Announced'}
        </span>
        {weddingData.daysRemaining > 0 && (
          <p className="text-lg">{weddingData.daysRemaining} Days To Go!</p>
        )}
        <Navbar path={path} isRsvpEnabled={weddingData.website.isRsvpEnabled} />
        {weddingData.website.isRsvpEnabled && (
          <Link
            href={`${path}/rsvp`}
            className={`rounded-sm px-6 py-3 tracking-widest text-white hover:bg-pink-500 hover:underline bg-${sharedStyles.primaryColor}`}
          >
            RSVP
          </Link>
        )}
      </div>

      {weddingData.website.coverPhotoUrl && (
        <div className="relative h-80 w-full px-10">
          <Image
            src={weddingData.website.coverPhotoUrl}
            layout="fill"
            objectFit="contain"
            alt="Website Cover Photo"
          />
        </div>
      )}

      {weddingData.events.map((event) => {
        return (
          <div key={event.id} className="flex flex-col gap-2">
            <h3 className="text-4xl tracking-widest">{event.name.toLowerCase()}</h3>
            {!!event.date && (
              <span className="text-2xl font-thin">{formatDateStandard(event.date)}</span>
            )}
            {!!event.startTime && (
              <span className="text-2xl font-thin">
                {event.startTime}
                {!!event.endTime && ` - ${event.endTime}`}
              </span>
            )}
          </div>
        )
      })}

      <div className="text-center">
        <h2 className="border-b border-black px-5 pb-6 text-6xl">
          {weddingData.groomFirstName?.[0] ?? 'G'} & {weddingData.brideFirstName?.[0] ?? 'B'}
        </h2>
        <p className="mt-4 text-lg tracking-widest">
          {weddingData.date.numberFormat?.toString() ?? 'Date To Be Announced'}
        </p>
      </div>

      <div className="text-center">
        <p className="text-sm">Created by Kenford</p>
        <p className="text-sm">
          Getting married?{' '}
          <span className="underline">
            <Link href={'/'}>Create your wedding website for free</Link>
          </span>
        </p>
      </div>
    </main>
  )
}
