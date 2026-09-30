'use client'

import { Button } from '~/components/ui/button'

type BudgetErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function BudgetError({ error, reset }: Readonly<BudgetErrorProps>) {
  return (
    <div className='mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center md:px-6'>
      <h2 className='font-semibold text-xl md:text-2xl'>Unable to load your budget</h2>
      <p className='max-w-lg text-muted-foreground text-sm md:text-base'>
        We could not load your budget right now. Please try again.
      </p>
      {error.digest ? (
        <p className='rounded border border-border bg-muted px-3 py-2 font-mono text-xs'>
          Error ID: {error.digest}
        </p>
      ) : null}
      <Button type='button' onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
