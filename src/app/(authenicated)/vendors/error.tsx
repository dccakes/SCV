'use client'

type VendorsErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function VendorsError({ error, reset }: Readonly<VendorsErrorProps>) {
  return (
    <div className='mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center md:px-6'>
      <h2 className='font-semibold text-xl md:text-2xl'>Unable to load vendors</h2>
      <p className='max-w-lg text-muted-foreground text-sm md:text-base'>
        We could not load your vendor list right now. Please try again.
      </p>
      {error.digest ? (
        <p className='rounded border border-border bg-muted px-3 py-2 font-mono text-xs'>
          Error ID: {error.digest}
        </p>
      ) : null}
      <button
        type='button'
        className='rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:opacity-90'
        onClick={reset}
      >
        Try again
      </button>
    </div>
  )
}
