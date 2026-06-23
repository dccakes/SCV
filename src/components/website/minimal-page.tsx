import Link from 'next/link'

type WebsiteMinimalPageProps = {
  coupleNames: string
  isRsvpEnabled: boolean
  path: string
}

export default function WebsiteMinimalPage({
  coupleNames,
  isRsvpEnabled,
  path,
}: Readonly<WebsiteMinimalPageProps>) {
  return (
    <main className='flex min-h-[50vh] flex-col items-center justify-center gap-6 px-6 pb-24 text-center font-["Crimson_Text"] text-zinc-500'>
      <h1 className='text-5xl tracking-[0.2em]'>{coupleNames}</h1>
      {isRsvpEnabled ? (
        <Link href={`${path}/rsvp`} className='text-lg underline underline-offset-4'>
          RSVP
        </Link>
      ) : null}
    </main>
  )
}
