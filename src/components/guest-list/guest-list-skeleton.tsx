import { Skeleton } from '~/components/ui/skeleton'

export function GuestListSkeleton() {
  return (
    <div className='flex flex-col gap-4' aria-busy='true'>
      {/* Event filter tabs */}
      <div className='flex items-center gap-5 border-border border-b pb-px'>
        <Skeleton className='mb-3 h-5 w-20' />
        <Skeleton className='mb-3 h-5 w-28' />
        <Skeleton className='mb-3 h-5 w-24' />
      </div>

      {/* Invite link button + search/filter row */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-wrap items-center gap-2'>
          <Skeleton className='h-9 w-64' />
          <Skeleton className='h-9 w-28' />
          <Skeleton className='h-9 w-28' />
          <Skeleton className='h-9 w-28' />
        </div>
        <Skeleton className='h-9 w-28' />
      </div>

      {/* Toolbar: count + sort buttons */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <Skeleton className='h-4 w-32' />
        <div className='flex items-center gap-2'>
          <Skeleton className='h-8 w-28' />
          <Skeleton className='h-8 w-32' />
          <Skeleton className='h-8 w-16 rounded-md' />
        </div>
      </div>

      {/* Guest cards grid */}
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {['a', 'b', 'c', 'd', 'e', 'f'].map((cardId) => (
          <div
            key={`guest-skeleton-${cardId}`}
            className='flex flex-col gap-3 rounded-lg border border-border bg-card/90 p-4'
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='flex items-start gap-2.5'>
                <Skeleton className='h-9 w-9 shrink-0 rounded-full' />
                <div className='flex flex-col gap-1.5'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-3 w-24' />
                </div>
              </div>
              <Skeleton className='h-5 w-20 rounded-full' />
            </div>
            <div className='flex gap-2'>
              <Skeleton className='h-5 w-20 rounded-full' />
              <Skeleton className='h-5 w-16 rounded-full' />
            </div>
            <div className='flex items-center justify-between border-border/80 border-t pt-2'>
              <Skeleton className='h-3 w-28' />
              <Skeleton className='h-3 w-20' />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
