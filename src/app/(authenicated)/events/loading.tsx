import { Skeleton } from '~/components/ui/skeleton'

export default function EventsLoading() {
  return (
    <div className='container mx-auto px-4 py-6 md:py-8'>
      <div className='mb-6 md:mb-8'>
        <Skeleton className='h-8 w-36 md:h-10 md:w-44' />
        <Skeleton className='mt-2 h-4 w-64 md:h-5 md:w-80' />
      </div>

      <div className='mb-4 flex items-center justify-between md:mb-6'>
        <Skeleton className='h-4 w-20' />
        <Skeleton className='h-9 w-28' />
      </div>

      <div className='grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3'>
        {['a', 'b', 'c'].map((itemId) => (
          <div key={`event-loading-${itemId}`} className='rounded-lg border p-4'>
            <Skeleton className='h-6 w-40' />
            <Skeleton className='mt-2 h-4 w-28' />
            <Skeleton className='mt-4 h-20 w-full' />
            <div className='mt-4 flex gap-2'>
              <Skeleton className='h-8 w-16' />
              <Skeleton className='h-8 w-20' />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
