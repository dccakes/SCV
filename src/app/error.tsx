'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'

type AppErrorBoundaryProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AppErrorBoundary({ error, reset }: Readonly<AppErrorBoundaryProps>) {
  useEffect(() => {
    if (!posthog.__loaded) {
      return
    }
    posthog.captureException(error)
  }, [error])

  return (
    <div className='mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center md:px-6'>
      <h1 className='font-semibold text-2xl md:text-3xl'>Something went wrong</h1>
      <p className='max-w-lg text-muted-foreground text-sm md:text-base'>
        We hit an unexpected issue while loading this page. Please try again.
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
