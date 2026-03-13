import { cn } from '~/lib/utils'

type AsyncStateProps = {
  isLoading?: boolean
  isEmpty?: boolean
  error?: string | null
  loadingText?: string
  emptyText?: string
  className?: string
}

export function AsyncState({
  isLoading = false,
  isEmpty = false,
  error,
  loadingText = 'Loading...',
  emptyText = 'Nothing to show yet.',
  className,
}: Readonly<AsyncStateProps>) {
  if (isLoading) {
    return (
      <output
        aria-live='polite'
        className={cn('block font-sans text-muted-foreground text-sm', className)}
      >
        {loadingText}
      </output>
    )
  }

  if (error) {
    return (
      <p
        role='alert'
        aria-live='assertive'
        className={cn('font-sans text-destructive text-sm', className)}
      >
        {error}
      </p>
    )
  }

  if (isEmpty) {
    return (
      <output
        aria-live='polite'
        className={cn('block font-sans text-muted-foreground text-sm', className)}
      >
        {emptyText}
      </output>
    )
  }

  return null
}
