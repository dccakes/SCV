import { Clock } from 'lucide-react'
import { Button } from '~/components/ui/button'

type RsvpNotAcceptingMessageProps = {
  basePath: string
}

export default function RsvpNotAcceptingMessage({ basePath }: RsvpNotAcceptingMessageProps) {
  return (
    <main className='relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 px-6 py-12'>
      <div aria-hidden className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl' />
        <div className='absolute right-0 bottom-0 h-72 w-72 translate-x-1/4 rounded-full bg-accent/20 blur-3xl' />
      </div>

      <div className='w-full max-w-md space-y-6 rounded-2xl border border-border/70 bg-background/95 p-8 text-center shadow-2xl shadow-foreground/10 ring-1 ring-border/40 backdrop-blur-sm sm:p-10'>
        <div
          aria-hidden
          className='-mx-8 -mt-8 mb-2 h-1.5 rounded-t-2xl bg-gradient-to-r from-primary via-accent to-primary sm:-mx-10 sm:-mt-10'
        />

        <div className='flex justify-center'>
          <span className='inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20'>
            <Clock aria-hidden className='h-6 w-6' />
          </span>
        </div>

        <div className='space-y-2'>
          <p className='font-mono text-[0.6rem] text-muted-foreground uppercase tracking-[0.28em]'>
            Coming Soon
          </p>
          <h1 className='font-serif text-2xl text-foreground sm:text-3xl'>RSVPs not yet open</h1>
          <p className='text-muted-foreground text-sm leading-6'>
            We&apos;re not quite ready to accept RSVPs yet. Check back soon!
          </p>
        </div>

        <div className='pt-4'>
          <Button asChild className='w-full' size='lg'>
            <a href={basePath}>Back to Wedding</a>
          </Button>
        </div>
      </div>
    </main>
  )
}
