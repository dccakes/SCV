import { Skeleton } from '~/components/ui/skeleton'

export default function ChecklistLoading() {
  return (
    <div className='space-y-6 px-4 py-5 lg:px-6 lg:py-6' aria-busy='true'>
      {/* Milestones card */}
      <div className='overflow-hidden rounded-lg border border-border/60 bg-card/95 shadow-sm'>
        <div className='flex flex-col gap-2 p-6'>
          <Skeleton className='h-3 w-20' />
          <Skeleton className='h-8 w-56' />
        </div>
        <div className='px-6 pb-6'>
          <div className='flex gap-3 overflow-x-hidden pb-2'>
            {['a', 'b', 'c', 'd', 'e'].map((id) => (
              <div
                key={`milestone-skeleton-${id}`}
                className='flex min-w-[190px] flex-col gap-2 rounded-lg border border-border/60 bg-background/70 p-3'
              >
                <Skeleton className='h-2.5 w-16' />
                <Skeleton className='mt-1 h-4 w-32' />
                <div className='mt-2 flex items-center gap-2'>
                  <Skeleton className='h-2.5 w-2.5 rounded-full' />
                  <Skeleton className='h-2.5 w-14' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks card */}
      <div className='overflow-hidden rounded-lg border border-border/60 bg-card/95 shadow-sm'>
        <div className='flex flex-col gap-2 p-6 pb-4'>
          <Skeleton className='h-3 w-16' />
          <div className='flex items-center justify-between'>
            <Skeleton className='h-8 w-52' />
            <div className='flex items-center gap-2'>
              <Skeleton className='h-8 w-20' />
              <Skeleton className='h-4 w-28' />
            </div>
          </div>
        </div>
        <div className='space-y-4 px-6 pb-6'>
          {/* Filter chips */}
          <div className='space-y-3'>
            <div className='space-y-2'>
              <Skeleton className='h-2.5 w-16' />
              <div className='flex flex-wrap gap-2'>
                {['a', 'b', 'c', 'd'].map((id) => (
                  <Skeleton key={`cat-skeleton-${id}`} className='h-7 w-20 rounded-full' />
                ))}
              </div>
            </div>
            <div className='space-y-2'>
              <Skeleton className='h-2.5 w-12' />
              <div className='flex gap-2'>
                <Skeleton className='h-7 w-24 rounded-full' />
                <Skeleton className='h-7 w-28 rounded-full' />
              </div>
            </div>
            <div className='space-y-2'>
              <Skeleton className='h-2.5 w-12' />
              <div className='flex gap-2'>
                {['a', 'b', 'c'].map((id) => (
                  <Skeleton key={`status-skeleton-${id}`} className='h-7 w-20 rounded-full' />
                ))}
              </div>
            </div>
          </div>

          {/* Task buckets */}
          {['a', 'b'].map((bucketId) => (
            <div key={`bucket-skeleton-${bucketId}`} className='space-y-2'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-3 w-20' />
                <div className='h-px flex-1 bg-border/70' />
                <Skeleton className='h-3 w-4' />
              </div>
              <div className='space-y-1'>
                {['a', 'b', 'c'].map((taskId) => (
                  <div
                    key={`task-skeleton-${bucketId}-${taskId}`}
                    className='flex min-h-[44px] items-center gap-3 rounded-lg px-2 py-2'
                  >
                    <Skeleton className='h-4 w-4 flex-shrink-0 rounded' />
                    <Skeleton className='h-4 flex-1' />
                    <Skeleton className='h-3 w-16' />
                    <Skeleton className='h-7 w-10' />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
