import Link from 'next/link'
import type { TemplateMinimalProps } from '~/templates/types'

export function ClassicMinimal({
  coupleNames,
  isRsvpEnabled,
  path,
}: Readonly<TemplateMinimalProps>) {
  return (
    <main className='flex min-h-[50vh] flex-col items-center justify-center gap-6 px-6 pb-24 text-center text-zinc-500'>
      <h1 className='text-5xl tracking-[0.2em]'>{coupleNames}</h1>
      {isRsvpEnabled ? (
        <Link href={`${path}/rsvp`} className='text-lg underline underline-offset-4'>
          RSVP
        </Link>
      ) : null}
    </main>
  )
}
