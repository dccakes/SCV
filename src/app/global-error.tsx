'use client'

type GlobalErrorBoundaryProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalErrorBoundary({ error, reset }: Readonly<GlobalErrorBoundaryProps>) {
  return (
    <html lang='en'>
      <body className='bg-background text-foreground antialiased'>
        <main className='mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center md:px-6'>
          <h1 className='font-semibold text-2xl md:text-3xl'>Unexpected application error</h1>
          <p className='max-w-lg text-muted-foreground text-sm md:text-base'>
            Something failed at the application level. You can try again or reload the page.
          </p>
          {error.digest ? (
            <p className='rounded border border-border bg-muted px-3 py-2 font-mono text-xs'>
              Error ID: {error.digest}
            </p>
          ) : null}
          <div className='flex flex-col gap-3 sm:flex-row'>
            <button
              type='button'
              className='rounded-md border border-border px-4 py-2 font-medium text-sm transition-colors hover:bg-muted'
              onClick={reset}
            >
              Try again
            </button>
            <button
              type='button'
              className='rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:opacity-90'
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
