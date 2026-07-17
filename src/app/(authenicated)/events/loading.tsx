import { Skeleton } from '~/components/ui/skeleton'

export default function EventsLoading() {
  return (
    <>
      <div className='flex h-14 flex-shrink-0 items-center justify-between border-border/80 border-b bg-card/70 px-4 lg:px-6'>
        <div className='flex items-center gap-3'>
          <Skeleton className='h-8 w-8 lg:hidden' />
          <Skeleton className='h-5 w-16' />
        </div>
        <Skeleton className='h-8 w-8' />
      </div>

      <main className='min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6 lg:py-6'>
        <div className='mb-4 flex items-center justify-between md:mb-6'>
          <Skeleton className='h-4 w-16' />
          <Skeleton className='h-9 w-28' />
        </div>

        <div className='grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3'>
          {['a', 'b', 'c'].map((itemId) => (
            <div key={`event-loading-${itemId}`} className='rounded-lg border p-4'>
              <div className='flex items-start justify-between gap-2'>
                <div className='flex-1'>
                  <Skeleton className='h-6 w-40' />
                  <Skeleton className='mt-1.5 h-4 w-28' />
                </div>
                <Skeleton className='h-5 w-16 shrink-0' />
              </div>
              <Skeleton className='mt-4 h-20 w-full rounded-md' />
              <div className='mt-4 flex items-center justify-between pt-2'>
                <Skeleton className='h-8 w-24' />
                <Skeleton className='h-8 w-8' />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
