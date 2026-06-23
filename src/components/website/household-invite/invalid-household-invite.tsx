import { getTranslations } from 'next-intl/server'

type InvalidHouseholdInviteProps = {
  websiteSubUrl: string
}

export async function InvalidHouseholdInvite({
  websiteSubUrl,
}: Readonly<InvalidHouseholdInviteProps>) {
  const t = await getTranslations('invite')
  return (
    <main className='min-h-screen bg-background px-5 py-10 text-foreground'>
      <section className='mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-2xl flex-col justify-center'>
        <p className='mb-5 font-mono text-muted-foreground text-xs uppercase tracking-[0.28em]'>
          {t('saveTheDate')}
        </p>
        <h1 className='font-display text-5xl italic leading-none md:text-7xl'>
          {t('couldNotOpen')}
        </h1>
        <p className='mt-8 max-w-xl font-sans text-muted-foreground leading-7'>
          {t('invalidLinkDescription')}
        </p>
        <p className='mt-6 font-mono text-muted-foreground text-xs uppercase tracking-[0.22em]'>
          {websiteSubUrl}
        </p>
      </section>
    </main>
  )
}
