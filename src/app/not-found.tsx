import Link from 'next/link'

import { Button } from '~/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className='flex min-h-screen items-center justify-center px-4'>
      <div className='flex max-w-sm flex-col items-center gap-5 py-16 text-center'>
        <div className='flex h-16 w-16 items-center justify-center rounded-full border border-border/80 bg-muted/50'>
          <span className='text-2xl opacity-50' aria-hidden='true'>
            ◈
          </span>
        </div>
        <div>
          <p className='mb-1 font-mono text-[0.6rem] text-foreground/40 uppercase tracking-[0.18em]'>
            404
          </p>
          <h1 className='font-serif text-2xl text-foreground'>Page not found</h1>
          <p className='mt-2 font-mono text-[0.65rem] text-foreground/55 leading-relaxed tracking-wider'>
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>
        </div>
        <Button asChild>
          <Link href='/'>Go to home page</Link>
        </Button>
      </div>
    </div>
  )
}
