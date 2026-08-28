import { getTranslations } from 'next-intl/server'
import { Card, CardContent } from '~/components/ui/card'

type InvalidHouseholdInviteProps = {
  websiteSubUrl: string
}

export async function InvalidHouseholdInvite({
  websiteSubUrl,
}: Readonly<InvalidHouseholdInviteProps>) {
  const t = await getTranslations('invite')
  return (
    <main className='relative min-h-screen overflow-hidden bg-background px-5 py-12 text-foreground sm:py-16'>
      <div aria-hidden className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute right-0 bottom-0 h-72 w-72 translate-x-1/4 rounded-full bg-accent/15 blur-3xl' />
      </div>

      <div className='mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-2xl items-center'>
        <Card className='w-full overflow-hidden border-border/70 shadow-foreground/5 shadow-xl'>
          <div className='h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary' />
          <CardContent className='px-6 py-12 text-center sm:px-12 sm:py-16'>
            <p className='font-mono text-muted-foreground text-xs uppercase tracking-[0.28em]'>
              {t('saveTheDate')}
            </p>
            <h1 className='mt-4 font-display text-4xl italic leading-tight sm:text-6xl'>
              {t('couldNotOpen')}
            </h1>
            <p className='mx-auto mt-8 max-w-xl font-sans text-muted-foreground leading-7'>
              {t('invalidLinkDescription')}
            </p>
            <p className='mt-6 font-mono text-muted-foreground text-xs uppercase tracking-[0.22em]'>
              {websiteSubUrl}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
