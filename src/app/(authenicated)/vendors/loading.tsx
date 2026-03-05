import { Skeleton } from '~/components/ui/skeleton'

export default function VendorsLoading() {
  return (
    <div className='px-4 py-6 md:px-6 md:py-8 lg:px-8'>
      <div className='mb-6 md:mb-8'>
        <Skeleton className='h-8 w-36 md:h-10 md:w-44' />
        <Skeleton className='mt-2 h-4 w-56 md:h-5 md:w-72' />
      </div>

      <div className='grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3'>
        {['a', 'b', 'c', 'd'].map((itemId) => (
          <div key={`vendor-loading-${itemId}`} className='rounded-lg border p-4'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='mt-2 h-4 w-24' />
            <Skeleton className='mt-4 h-16 w-full' />
            <div className='mt-4 flex gap-2'>
              <Skeleton className='h-8 w-20' />
              <Skeleton className='h-8 w-24' />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
